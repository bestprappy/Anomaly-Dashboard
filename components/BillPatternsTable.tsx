"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ChevronDown,
  Download,
  Gauge,
  Loader2,
  PowerOff,
  Wrench,
} from "lucide-react";
import {
  api,
  MeterPattern,
  MeterPatternRecord,
  MeterPatternsData,
} from "@/lib/api";
import { MetricTile } from "@/components/ui/MetricTile";
import { Tabs } from "@/components/ui/Tabs";
import { downloadBlob } from "@/lib/csv";

const PAGE_SIZE = 50;

type PatternFilter = "all" | MeterPattern;

interface PatternMeta {
  label: string;
  hint: string;
  badgeClass: string;
}

const PATTERN_META: Record<MeterPattern, PatternMeta> = {
  shutdown: {
    label: "Shutdown",
    hint: "No bill at all for the whole window",
    badgeClass: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  maintenance: {
    label: "Maintenance",
    hint: "Only the meter charge (<200฿) every month",
    badgeClass: "border-warning/40 bg-warning/10 text-warning",
  },
  gap: {
    label: "Gap (ฟันหลอ)",
    hint: "Billed some months, missing others",
    badgeClass: "border-info/40 bg-info/10 text-info",
  },
  normal: {
    label: "Normal",
    hint: "A real bill every month",
    badgeClass: "border-border bg-surface text-muted-foreground",
  },
};

const PATTERN_TABS: ReadonlyArray<{ value: PatternFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "shutdown", label: "Shutdown" },
  { value: "maintenance", label: "Maintenance" },
  { value: "gap", label: "Gap (ฟันหลอ)" },
  { value: "normal", label: "Normal" },
];

function formatMonth(month: number): string {
  const text = String(month);
  return text.length === 6 ? `${text.slice(0, 4)}-${text.slice(4)}` : text;
}

function amountForMonth(
  record: MeterPatternRecord,
  month: number
): number | null {
  const entry = record.monthly?.find((m) => m.month === month);
  return entry?.bill_amount ?? null;
}

function PatternBadge({ pattern }: { pattern: MeterPattern }) {
  const meta = PATTERN_META[pattern];
  if (!meta) {
    return <span className="text-xs text-muted-foreground">{pattern}</span>;
  }
  return (
    <span
      title={meta.hint}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badgeClass}`}
    >
      {meta.label}
    </span>
  );
}

interface BillPatternsTableProps {
  window?: number;
  onSiteSelect: (siteId: string) => void;
}

export function BillPatternsTable({
  window: monthsWindow = 3,
  onSiteSelect,
}: BillPatternsTableProps) {
  const [pattern, setPattern] = useState<PatternFilter>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const patternParam = pattern === "all" ? undefined : pattern;

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["meterPatterns", monthsWindow, pattern],
    queryFn: ({ pageParam }) =>
      api.getMeterPatterns({
        window: monthsWindow,
        pattern: patternParam,
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: MeterPatternsData) => {
      const nextOffset = lastPage.offset + lastPage.records.length;
      return nextOffset < lastPage.total_records ? nextOffset : undefined;
    },
    staleTime: 0,
    retry: 1,
  });

  const summary = data?.pages[0];
  const months = summary?.months ?? [];
  const records = useMemo(
    () => data?.pages.flatMap((page) => page.records) ?? [],
    [data]
  );
  const totalRecords = summary?.total_records ?? 0;

  const providerDetail = useMemo(() => {
    const entries = Object.entries(summary?.unique_meters_per_provider ?? {});
    if (entries.length === 0) return "Across all uploaded files";
    return entries
      .map(([provider, count]) => `${provider} ${count.toLocaleString()}`)
      .join(" · ");
  }, [summary?.unique_meters_per_provider]);

  const handleTabChange = (value: string) => {
    setPattern(value as PatternFilter);
    setExportError(null);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const blob = await api.getMeterPatternsCsv({
        window: monthsWindow,
        pattern: patternParam,
      });
      downloadBlob(`bill_patterns_${pattern}.csv`, blob);
    } catch (err) {
      console.error("[BillPatternsTable] datasheet export failed", err);
      setExportError(
        err instanceof Error ? err.message : "Datasheet export failed"
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card-base p-12 text-center">
        <p className="text-muted-foreground">Analyzing meter bill patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="card-base border-destructive/40 bg-destructive/10 p-6"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
          <div>
            <h4 className="font-semibold text-destructive">
              Bill patterns did not load
            </h4>
            <p className="mt-1 text-sm text-destructive/80">
              {error instanceof Error
                ? error.message
                : "The API did not return meter pattern data."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          icon={<Gauge className="h-5 w-5" />}
          label="Unique Meters"
          value={(summary?.unique_meters ?? 0).toLocaleString()}
          detail={providerDetail}
        />
        <MetricTile
          icon={<PowerOff className="h-5 w-5 text-destructive" />}
          label="Shutdown"
          value={(summary?.counts?.shutdown ?? 0).toLocaleString()}
          detail={`No bill for the last ${monthsWindow} months`}
        />
        <MetricTile
          icon={<Wrench className="h-5 w-5 text-warning" />}
          label="Maintenance Only"
          value={(summary?.counts?.maintenance ?? 0).toLocaleString()}
          detail={`Meter charge only for ${monthsWindow} months`}
        />
        <MetricTile
          icon={<Activity className="h-5 w-5 text-info" />}
          label="Gap (ฟันหลอ)"
          value={(summary?.counts?.gap ?? 0).toLocaleString()}
          detail="Billed intermittently in the window"
        />
      </div>

      <Tabs value={pattern} onValueChange={handleTabChange}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs.List aria-label="Filter meters by bill pattern">
            {PATTERN_TABS.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value}>
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={isExporting || totalRecords === 0}
              className="btn-base btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Download className="h-4 w-4" aria-hidden />
              )}
              Download CSV ({totalRecords.toLocaleString()})
            </button>
            {exportError ? (
              <p role="alert" className="text-xs text-destructive">
                {exportError}
              </p>
            ) : null}
          </div>
        </div>

        {PATTERN_TABS.map((tab) => (
          <Tabs.Panel key={tab.value} value={tab.value} className="mt-4">
            {records.length === 0 ? (
              <div className="card-base p-12 text-center">
                <p className="text-muted-foreground">
                  No meters with this pattern in the last {monthsWindow} months
                </p>
              </div>
            ) : (
              <div className="card-base overflow-hidden">
                <div className="border-b border-border px-6 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {records.length.toLocaleString()} of{" "}
                    {totalRecords.toLocaleString()} meters
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface/50">
                        <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                          Meter No
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                          Site ID
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                          Type
                        </th>
                        {months.map((month) => (
                          <th
                            key={month}
                            className="px-6 py-3 text-right font-semibold text-xs uppercase text-muted-foreground"
                          >
                            {formatMonth(month)}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                          Pattern
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {records.map((record, idx) => (
                        <tr
                          key={`${record.provider}-${record.meter_no ?? record.site_id}-${idx}`}
                          className="transition-colors hover:bg-surface/50"
                        >
                          <td className="px-6 py-4 font-mono text-xs font-semibold">
                            {record.meter_no ?? "—"}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => onSiteSelect(record.site_id)}
                              title={`View trend for ${record.site_id}`}
                              className="cursor-pointer rounded font-mono text-xs font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                            >
                              {record.site_id}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {record.provider}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {record.company ?? "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {record.site_type ?? "—"}
                          </td>
                          {months.map((month) => {
                            const amount = amountForMonth(record, month);
                            return (
                              <td
                                key={month}
                                className={`px-6 py-4 text-right font-mono text-xs ${
                                  amount === null
                                    ? "text-muted-foreground"
                                    : amount === 0
                                      ? "font-semibold text-destructive"
                                      : "text-foreground"
                                }`}
                              >
                                {amount === null ? "—" : amount.toLocaleString()}
                              </td>
                            );
                          })}
                          <td className="px-6 py-4">
                            <PatternBadge pattern={record.pattern} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hasNextPage && (
                  <div className="border-t border-border">
                    <button
                      type="button"
                      onClick={() => void fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-primary outline-none transition-colors hover:bg-surface/50 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isFetchingNextPage ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      )}
                      Show more (
                      {(totalRecords - records.length).toLocaleString()} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}

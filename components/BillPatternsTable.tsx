"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  Download,
  Gauge,
  PowerOff,
  Wrench,
} from "lucide-react";
import {
  MeterPattern,
  MeterPatternRecord,
  MeterPatternsData,
} from "@/lib/api";
import { MetricTile } from "@/components/ui/MetricTile";
import { Tabs } from "@/components/ui/Tabs";
import { buildCsv, downloadCsv } from "@/lib/csv";

const PAGE_SIZE = 10;

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
};

const PATTERN_TABS: ReadonlyArray<{ value: PatternFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "shutdown", label: "Shutdown" },
  { value: "maintenance", label: "Maintenance" },
  { value: "gap", label: "Gap (ฟันหลอ)" },
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
  data: MeterPatternsData;
  onSiteSelect: (siteId: string) => void;
}

export function BillPatternsTable({ data, onSiteSelect }: BillPatternsTableProps) {
  const [pattern, setPattern] = useState<PatternFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const records = useMemo(() => data.records ?? [], [data.records]);
  const months = useMemo(() => data.months ?? [], [data.months]);

  const filteredRecords = useMemo(
    () =>
      pattern === "all"
        ? records
        : records.filter((record) => record.pattern === pattern),
    [records, pattern]
  );

  const visibleRecords = filteredRecords.slice(0, visibleCount);
  const remainingCount = filteredRecords.length - visibleRecords.length;

  const providerDetail = useMemo(() => {
    const entries = Object.entries(data.unique_meters_per_provider ?? {});
    if (entries.length === 0) return "Across all uploaded files";
    return entries
      .map(([provider, count]) => `${provider} ${count.toLocaleString()}`)
      .join(" · ");
  }, [data.unique_meters_per_provider]);

  const handleTabChange = (value: string) => {
    setPattern(value as PatternFilter);
    setVisibleCount(PAGE_SIZE);
  };

  const handleDownload = () => {
    try {
      const headers = [
        "Meter No",
        "Site ID",
        "Provider",
        "Company",
        "Type",
        "Pattern",
        ...months.map(formatMonth),
      ];
      const rows = filteredRecords.map((record) => [
        record.meter_no ?? "",
        record.site_id,
        record.provider,
        record.company,
        record.site_type ?? "",
        PATTERN_META[record.pattern]?.label ?? record.pattern,
        ...months.map((month) => amountForMonth(record, month) ?? ""),
      ]);
      downloadCsv(`bill_patterns_${pattern}.csv`, buildCsv(headers, rows));
    } catch (error) {
      console.error("[BillPatternsTable] CSV download failed", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          icon={<Gauge className="h-5 w-5" />}
          label="Unique Meters"
          value={data.unique_meters.toLocaleString()}
          detail={providerDetail}
        />
        <MetricTile
          icon={<PowerOff className="h-5 w-5 text-destructive" />}
          label="Shutdown"
          value={(data.counts?.shutdown ?? 0).toLocaleString()}
          detail={`No bill for the last ${data.window} months`}
        />
        <MetricTile
          icon={<Wrench className="h-5 w-5 text-warning" />}
          label="Maintenance Only"
          value={(data.counts?.maintenance ?? 0).toLocaleString()}
          detail={`Meter charge only for ${data.window} months`}
        />
        <MetricTile
          icon={<Activity className="h-5 w-5 text-info" />}
          label="Gap (ฟันหลอ)"
          value={(data.counts?.gap ?? 0).toLocaleString()}
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
          <button
            type="button"
            onClick={handleDownload}
            disabled={filteredRecords.length === 0}
            className="btn-base btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export datasheet ({filteredRecords.length.toLocaleString()})
          </button>
        </div>

        {PATTERN_TABS.map((tab) => (
          <Tabs.Panel key={tab.value} value={tab.value} className="mt-4">
            {filteredRecords.length === 0 ? (
              <div className="card-base p-12 text-center">
                <p className="text-muted-foreground">
                  No meters with this pattern in the last {data.window} months
                </p>
              </div>
            ) : (
              <div className="card-base overflow-hidden">
                <div className="border-b border-border px-6 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {visibleRecords.length.toLocaleString()} of{" "}
                    {filteredRecords.length.toLocaleString()} meters
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
                      {visibleRecords.map((record, idx) => (
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
                            {record.company}
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

                {remainingCount > 0 && (
                  <div className="border-t border-border">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-primary outline-none transition-colors hover:bg-surface/50 focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden />
                      Show more ({remainingCount.toLocaleString()} remaining)
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

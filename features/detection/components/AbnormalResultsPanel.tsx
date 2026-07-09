"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";

import type { AbnormalRow } from "@/lib/mlApi";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { SeverityBadge } from "@/features/detection/components/SeverityBadge";
import { MAX_TABLE_ROWS } from "@/features/detection/data";
import { formatCount, formatKwh } from "@/features/detection/format";
import { useAbnormalAnomalies } from "@/features/detection/hooks";

/**
 * Step 5 of the Process tab: the flagged (site, month, kWh) rows of the
 * current model, ranked by how far outside the band they landed.
 */

const COLUMNS: DataTableColumn<AbnormalRow>[] = [
  {
    key: "site",
    header: "Site ID",
    render: (row) => (
      <span className="font-mono text-xs font-semibold text-primary">{row.site_id}</span>
    ),
  },
  { key: "month", header: "Month", render: (row) => row.anom_month },
  {
    key: "kwh",
    header: "Actual kWh",
    align: "right",
    render: (row) => <span className="font-semibold">{formatKwh(row.kwh)}</span>,
  },
  {
    key: "band",
    header: "Expected band",
    align: "right",
    render: (row) => (
      <span className="font-mono text-xs text-muted-foreground">
        {formatKwh(row.q05)} – {formatKwh(row.q95)}
      </span>
    ),
  },
  {
    key: "severity",
    header: "Severity",
    render: (row) => <SeverityBadge severity={row.quantile_severity} />,
  },
];

export function AbnormalResultsPanel() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useAbnormalAnomalies();

  const visibleRows = useMemo(() => data?.rows.slice(0, MAX_TABLE_ROWS) ?? [], [data]);

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy>
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorNotice title="Couldn't load flagged anomalies" error={error} onRetry={() => refetch()} />
    );
  }

  if (!data) {
    return (
      <div className="rounded-md border border-border bg-surface/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No model on the server yet — build one above to see flagged anomalies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{formatCount(data.count)}</span> site-months
          fell outside the prediction band
          {data.count > MAX_TABLE_ROWS
            ? ` — showing the ${MAX_TABLE_ROWS} most severe`
            : ""}
          .
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="btn-base btn-ghost text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={visibleRows}
        rowKey={(row) => `${row.site_id}-${row.anom_month}`}
        caption="Flagged anomalies ranked by severity"
        emptyMessage="The model flagged no anomalies in the testing window."
      />
    </div>
  );
}

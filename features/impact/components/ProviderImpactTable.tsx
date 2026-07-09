import { AlertCircle } from "lucide-react";

import type { ProviderImpactSummary } from "@/lib/mlApi";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { formatCount, formatKwh } from "@/lib/format";
import { formatBaht } from "@/features/impact/format";

/** PEA/MEA breakdown. Sites without a derivable rate count as anomalies but
 *  contribute no baht, so the table calls out when totals are understated. */

const COLUMNS: DataTableColumn<ProviderImpactSummary>[] = [
  {
    key: "provider",
    header: "Provider",
    render: (row) => (
      <span className="font-semibold text-foreground">{row.provider ?? "Unknown"}</span>
    ),
  },
  {
    key: "anomalies",
    header: "Spike-up anomalies",
    align: "right",
    render: (row) => <span className="tabular-nums">{formatCount(row.n_anomalies)}</span>,
  },
  {
    key: "priced",
    header: "Priced",
    align: "right",
    render: (row) => (
      <span className="tabular-nums">
        {formatCount(row.n_priced)}
        {row.n_priced < row.n_anomalies ? (
          <span className="text-muted-foreground"> of {formatCount(row.n_anomalies)}</span>
        ) : null}
      </span>
    ),
  },
  {
    key: "kwh",
    header: "Excess kWh",
    align: "right",
    render: (row) => <span className="tabular-nums">{formatKwh(row.total_excess_kwh)}</span>,
  },
  {
    key: "baht",
    header: "Estimated cost",
    align: "right",
    render: (row) => (
      <span className="font-semibold tabular-nums">{formatBaht(row.total_estimated_baht)}</span>
    ),
  },
];

interface ProviderImpactTableProps {
  providers: ProviderImpactSummary[];
}

export function ProviderImpactTable({ providers }: ProviderImpactTableProps) {
  const unpriced = providers.reduce(
    (sum, row) => sum + Math.max(0, row.n_anomalies - row.n_priced),
    0
  );

  return (
    <div className="space-y-3">
      <DataTable
        columns={COLUMNS}
        rows={providers}
        rowKey={(row, index) => row.provider ?? `unknown-${index}`}
        caption="Estimated excess cost by electricity provider"
        emptyMessage="No spike-up anomalies in the current classification."
      />
      {unpriced > 0 ? (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning" aria-hidden />
          {formatCount(unpriced)} anomal{unpriced === 1 ? "y" : "ies"} belong to sites with no clean
          billing history to derive a baht/kWh rate from — the cost totals above understate the real
          impact by those rows.
        </p>
      ) : null}
    </div>
  );
}

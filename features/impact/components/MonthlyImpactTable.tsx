import type { MonthlyImpactSummary } from "@/lib/mlApi";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { formatCount, formatKwh } from "@/lib/format";
import { formatBaht } from "@/features/impact/format";

/** Table-view twin of the monthly chart — every plotted value, readable
 *  without hover or color. */

const COLUMNS: DataTableColumn<MonthlyImpactSummary>[] = [
  { key: "month", header: "Month", render: (row) => <span className="font-medium">{row.month}</span> },
  {
    key: "anomalies",
    header: "Spike-up anomalies",
    align: "right",
    render: (row) => <span className="tabular-nums">{formatCount(row.n_anomalies)}</span>,
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

interface MonthlyImpactTableProps {
  months: MonthlyImpactSummary[];
}

export function MonthlyImpactTable({ months }: MonthlyImpactTableProps) {
  return (
    <DataTable
      columns={COLUMNS}
      rows={months}
      rowKey={(row) => row.month}
      caption="Estimated excess cost by calendar month"
      emptyMessage="No priced anomalies in the test range."
    />
  );
}

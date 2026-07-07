"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MissingSummary, MonthMissingRate } from "@/lib/mlApi";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { formatCount, formatRate, formatYyyymm } from "@/features/detection/format";

/**
 * Missing-rate per month for the candidate window — single series, single
 * hue (--chart-2), recessive grid, hover tooltip, plus a table view for
 * accessibility.
 */

interface ChartDatum {
  label: string;
  ratePct: number;
  missing_count: number;
  total_sites: number;
}

interface TooltipEntry {
  payload?: ChartDatum;
}

function MissingRateTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
}) {
  const datum = payload?.[0]?.payload;
  if (!active || !datum) return null;

  return (
    <div
      className="rounded-md border border-border bg-popover px-4 py-3 text-sm"
      style={{ boxShadow: "var(--shadow-lifted)" }}
    >
      <p className="font-semibold text-foreground">{datum.label}</p>
      <p className="mt-1 text-muted-foreground">
        Missing rate: <span className="font-semibold text-foreground">{datum.ratePct.toFixed(1)}%</span>
      </p>
      <p className="text-muted-foreground">
        {formatCount(datum.missing_count)} of {formatCount(datum.total_sites)} sites
      </p>
    </div>
  );
}

const TABLE_COLUMNS: DataTableColumn<MonthMissingRate>[] = [
  { key: "month", header: "Month", render: (row) => formatYyyymm(row.month) },
  {
    key: "rate",
    header: "Missing rate",
    align: "right",
    render: (row) => formatRate(row.missing_rate),
  },
  {
    key: "missing",
    header: "Missing sites",
    align: "right",
    render: (row) => formatCount(row.missing_count),
  },
  {
    key: "total",
    header: "Total sites",
    align: "right",
    render: (row) => formatCount(row.total_sites),
  },
];

interface MissingRateChartProps {
  missing: MissingSummary;
}

export function MissingRateChart({ missing }: MissingRateChartProps) {
  const data = useMemo<ChartDatum[]>(
    () =>
      (missing.per_month ?? []).map((row) => ({
        label: formatYyyymm(row.month),
        ratePct: row.missing_rate * 100,
        missing_count: row.missing_count,
        total_sites: row.total_sites,
      })),
    [missing.per_month]
  );

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No billing months found in the selected window.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">Missing rate per month</h4>
        <p className="text-xs text-muted-foreground">
          Average over window:{" "}
          <span className="font-semibold text-foreground">
            {formatRate(missing.avg_missing_rate)}
          </span>
        </p>
      </div>

      <div className="h-64 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="25%">
            <CartesianGrid vertical={false} stroke="var(--border)" opacity={0.4} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => `${value}%`}
            />
            <Tooltip
              content={<MissingRateTooltip />}
              cursor={{ fill: "var(--surface)", opacity: 0.6 }}
            />
            <Bar
              dataKey="ratePct"
              fill="var(--chart-2)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="text-sm">
        <summary className="focus-ring cursor-pointer rounded text-muted-foreground hover:text-foreground">
          View as table
        </summary>
        <div className="mt-3">
          <DataTable
            columns={TABLE_COLUMNS}
            rows={missing.per_month ?? []}
            rowKey={(row) => String(row.month)}
            caption="Missing rate per month"
          />
        </div>
      </details>
    </div>
  );
}

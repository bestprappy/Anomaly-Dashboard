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

import type { MonthlyImpactSummary } from "@/lib/mlApi";
import { formatCount, formatKwh } from "@/lib/format";
import { formatBaht, formatBahtCompact } from "@/features/impact/format";

/**
 * Estimated excess cost per calendar month of the test range. One series,
 * so no legend — the section title names it. Money wears --chart-2, the
 * same hue billing amounts use everywhere else in the app.
 */

interface MonthlyImpactChartProps {
  months: MonthlyImpactSummary[];
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: MonthlyImpactSummary }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div
      className="rounded-md border border-border bg-card px-4 py-3 text-sm"
      style={{ boxShadow: "var(--shadow-lifted)" }}
    >
      <p className="font-semibold text-foreground">{row.month}</p>
      <dl className="mt-1 space-y-0.5 text-muted-foreground">
        <div className="flex items-center justify-between gap-6">
          <dt className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "var(--chart-2)" }}
              aria-hidden
            />
            Estimated cost
          </dt>
          <dd className="font-semibold text-foreground">{formatBaht(row.total_estimated_baht)}</dd>
        </div>
        <div className="flex items-center justify-between gap-6">
          <dt>Excess energy</dt>
          <dd className="tabular-nums">{formatKwh(row.total_excess_kwh)} kWh</dd>
        </div>
        <div className="flex items-center justify-between gap-6">
          <dt>Spike-up anomalies</dt>
          <dd className="tabular-nums">{formatCount(row.n_anomalies)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function MonthlyImpactChart({ months }: MonthlyImpactChartProps) {
  const data = useMemo(
    () => months.filter((row) => Number.isFinite(row.total_estimated_baht)),
    [months]
  );

  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-border bg-surface/30">
        <p className="text-sm text-muted-foreground">No priced anomalies in the test range.</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full" role="img" aria-label="Bar chart of estimated excess cost per month">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
          <XAxis
            dataKey="month"
            stroke="var(--muted-foreground)"
            style={{ fontSize: 12 }}
            tick={{ fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            style={{ fontSize: 12 }}
            tick={{ fill: "var(--muted-foreground)" }}
            tickFormatter={formatBahtCompact}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            width={72}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "var(--muted)", opacity: 0.35 }}
          />
          <Bar
            dataKey="total_estimated_baht"
            name="Estimated cost"
            fill="var(--chart-2)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

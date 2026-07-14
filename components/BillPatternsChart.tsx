"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { MeterPatternCompanyCounts } from "@/lib/api";

/**
 * Problem-meter composition per provider/company: horizontal grouped bars
 * for Shutdown and Gap counts. Normal meters dominate every group (~95%+),
 * so they are context in the tooltip rather than a bar that would squash
 * the interesting segments.
 */

interface ChartDatum {
  name: string;
  shutdown: number;
  gap: number;
  normal: number;
  total: number;
}

const ROW_HEIGHT = 64;
const CHART_MIN_HEIGHT = 220;

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : 0;
}

function groupName(providerValue: unknown, companyValue: unknown): string {
  const provider =
    typeof providerValue === "string" && providerValue.trim()
      ? providerValue.trim()
      : "Unknown provider";
  const company =
    typeof companyValue === "string" && companyValue.trim()
      ? companyValue.trim()
      : "—";
  return `${provider} · ${company}`;
}

function buildChartData(
  entries: ReadonlyArray<MeterPatternCompanyCounts>
): ChartDatum[] {
  return entries
    .map((entry) => {
      const shutdown = safeCount(entry.shutdown);
      const gap = safeCount(entry.gap);
      const normal = safeCount(entry.normal);
      return {
        name: groupName(entry.provider, entry.company),
        shutdown,
        gap,
        normal,
        total: Math.max(safeCount(entry.total), shutdown + gap + normal),
      };
    })
    .filter((row) => row.shutdown > 0 || row.gap > 0)
    .sort((a, b) => {
      const problemDifference =
        b.shutdown + b.gap - (a.shutdown + a.gap);
      return problemDifference || a.name.localeCompare(b.name);
    });
}

function PatternTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as ChartDatum | undefined;
  if (!row) return null;

  return (
    <div
      className="rounded-md border border-border bg-card px-4 py-3 text-sm"
      style={{ boxShadow: "var(--shadow-lifted)" }}
    >
      <p className="font-semibold text-foreground">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((series) => (
          <div key={series.dataKey} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: series.color }}
            />
            <span className="text-muted-foreground">{series.name}:</span>
            <span className="font-mono font-semibold text-foreground">
              {(series.value ?? 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Normal {row.normal.toLocaleString()} · {row.total.toLocaleString()}{" "}
        meters total
      </p>
    </div>
  );
}

interface BillPatternsChartProps {
  entries?: MeterPatternCompanyCounts[];
  totalMeters: number;
  window: number;
}

export function BillPatternsChart({
  entries,
  totalMeters,
  window: monthsWindow,
}: BillPatternsChartProps) {
  const data = useMemo(
    () => buildChartData(Array.isArray(entries) ? entries : []),
    [entries]
  );

  if (entries === undefined) {
    return (
      <div className="card-base p-12 text-center" role="status">
        <p className="text-muted-foreground">
          The company chart breakdown is not available yet. Use Table view
          while the data service is updated.
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="card-base p-12 text-center" role="status">
        <p className="text-muted-foreground">
          {safeCount(totalMeters) > 0
            ? "No provider/company breakdown is available for these meters"
            : "No meter data to chart yet — upload billing files first"}
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card-base p-12 text-center" role="status">
        <p className="text-muted-foreground">
          No shutdown or gap meters in the last {monthsWindow} months — every
          meter billed normally
        </p>
      </div>
    );
  }

  return (
    <div className="card-base p-6">
      <p className="mb-4 text-sm text-muted-foreground">
        Meters with no bill (Shutdown) or intermittent bills (Gap) in the last{" "}
        {monthsWindow} months, by provider and company
      </p>
      <div
        role="img"
        aria-label={`Grouped bar chart of shutdown and gap meters across ${data.length.toLocaleString()} provider and company groups`}
        style={{
          height: Math.max(CHART_MIN_HEIGHT, data.length * ROW_HEIGHT + 60),
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
            barGap={2}
            barCategoryGap="28%"
          >
            <CartesianGrid
              horizontal={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
              opacity={0.3}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              stroke="var(--muted-foreground)"
              style={{ fontSize: 12 }}
              tick={{ fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickFormatter={(value: number) => value.toLocaleString()}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              stroke="var(--muted-foreground)"
              style={{ fontSize: 12 }}
              tick={{ fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <Tooltip
              content={<PatternTooltip />}
              cursor={{ fill: "var(--surface)", opacity: 0.5 }}
            />
            <Legend
              formatter={(value: string) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
            <Bar
              dataKey="shutdown"
              name="Shutdown"
              fill="var(--chart-shutdown)"
              barSize={14}
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="gap"
              name="Gap"
              fill="var(--chart-gap)"
              barSize={14}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>
          Charted provider and company groups with shutdown, gap, normal, and
          total meter counts
        </caption>
        <thead>
          <tr>
            <th scope="col">Provider and company</th>
            <th scope="col">Shutdown</th>
            <th scope="col">Gap</th>
            <th scope="col">Normal</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.name}>
              <th scope="row">{row.name}</th>
              <td>{row.shutdown}</td>
              <td>{row.gap}</td>
              <td>{row.normal}</td>
              <td>{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

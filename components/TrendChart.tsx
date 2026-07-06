"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SiteTrend } from "@/lib/api";

interface TrendChartProps {
  trend: SiteTrend;
}

export function TrendChart({ trend }: TrendChartProps) {
  if (!trend.found) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Site not found</p>
      </div>
    );
  }

  const data = trend.series.map((point) => ({
    month: point.month.toString().replace(/(\d{4})(\d{2})/, "$1-$2"),
    value: point.value,
  }));

  const validData = data.filter((d) => d.value !== null);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{trend.site_id}</h3>
        <div className="mt-1 flex gap-3 text-sm text-muted-foreground">
          {trend.provider && <span>Provider: {trend.provider}</span>}
          {trend.company && <span>Company: {trend.company}</span>}
          {trend.site_type && <span>Type: {trend.site_type}</span>}
        </div>
        <p className="mt-1 text-xs uppercase text-muted-foreground">
          Metric: {trend.metric}
        </p>
      </div>

      {validData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={validData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="month"
              stroke="var(--muted-foreground)"
              style={{ fontSize: 12 }}
            />
            <YAxis stroke="var(--muted-foreground)" style={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              dot={{ fill: "var(--primary)" }}
              strokeWidth={2}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-80 items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}
    </div>
  );
}

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
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-900/20 backdrop-blur-xl p-6 shadow-xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
          {trend.site_id}
        </h3>
        <div className="mt-2 flex gap-4 text-sm">
          {trend.provider && <span className="text-slate-400">Provider: <span className="text-slate-200 font-medium">{trend.provider}</span></span>}
          {trend.company && <span className="text-slate-400">Company: <span className="text-slate-200 font-medium">{trend.company}</span></span>}
          {trend.site_type && <span className="text-slate-400">Type: <span className="text-slate-200 font-medium">{trend.site_type}</span></span>}
        </div>
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
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

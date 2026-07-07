"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SiteTrend } from "@/lib/api";
import { Building2, Zap } from "lucide-react";

interface TrendChartProps {
  trend: SiteTrend;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  fill?: string;
}

const CustomDot = ({ cx, cy, fill }: CustomDotProps) => {
  if (typeof cx !== "number" || typeof cy !== "number") return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={fill}
      opacity={0}
    />
  );
};

export function TrendChart({ trend }: TrendChartProps) {
  if (!trend.found) {
    return (
      <div className="card-base flex h-96 items-center justify-center p-6">
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
    <div className="card-base p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-baseline gap-3 mb-4">
          <h3 className="text-2xl font-bold text-foreground">
            {trend.site_id}
          </h3>
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            {trend.metric}
          </span>
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          {trend.provider && (
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Provider:</span>
              <span className="text-foreground font-semibold">{trend.provider}</span>
            </div>
          )}
          {trend.company && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Company:</span>
              <span className="text-foreground font-semibold">{trend.company}</span>
            </div>
          )}
          {trend.site_type && (
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="text-foreground font-semibold ml-2">{trend.site_type}</span>
            </div>
          )}
        </div>
      </div>

      {validData.length > 0 ? (
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={validData}
              margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--primary)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
                opacity={0.3}
              />

              <XAxis
                dataKey="month"
                stroke="var(--muted-foreground)"
                style={{ fontSize: 12 }}
                tick={{ fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
              />

              <YAxis
                stroke="var(--muted-foreground)"
                style={{ fontSize: 12 }}
                tick={{ fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  boxShadow: "var(--shadow-lifted)",
                  padding: "12px 16px",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                formatter={(value) => [
                  typeof value === 'number' ? value.toFixed(2) : value,
                  'Value'
                ]}
                cursor={{
                  stroke: "var(--primary)",
                  strokeOpacity: 0.5,
                }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={3}
                fill="url(#colorValue)"
                dot={<CustomDot fill="var(--primary)" />}
                activeDot={{
                  r: 6,
                  fill: "var(--primary)",
                }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-80 items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}
    </div>
  );
}

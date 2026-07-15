"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SiteTrend, SiteTrendBundle } from "@/lib/api";
import {
  SegmentedControl,
  SegmentedControlOption,
} from "@/components/ui/SegmentedControl";
import { Building2, ReceiptText, Zap } from "lucide-react";

interface TrendChartProps {
  trend: SiteTrendBundle;
  /** Months (YYYYMM keys) to mark with a glowing anomaly ping on the KWH series. */
  highlightMonths?: readonly number[];
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

const AnomalyPingDot = ({ cx, cy }: { cx?: number; cy?: number }) => {
  if (typeof cx !== "number" || typeof cy !== "number") return null;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={9}
        fill="none"
        stroke="var(--destructive)"
        strokeWidth={2}
        className="anomaly-ping-ring"
      />
      <circle
        cx={cx}
        cy={cy}
        r={4.5}
        fill="var(--destructive)"
        stroke="var(--card)"
        strokeWidth={2}
        style={{ filter: "drop-shadow(0 0 6px var(--destructive))" }}
      />
    </g>
  );
};

interface TrendChartDatum {
  billAmount: number | null;
  kwh: number | null;
  month: string;
  monthKey: number;
}

const TREND_RANGES = [
  { key: "3m", label: "3M", months: 3 },
  { key: "6m", label: "6M", months: 6 },
  { key: "1y", label: "1Y", months: 12 },
  { key: "3y", label: "3Y", months: 36 },
  { key: "all", label: "All", months: null },
] as const;

type TrendRangeKey = (typeof TREND_RANGES)[number]["key"];

const RANGE_OPTIONS: readonly SegmentedControlOption<TrendRangeKey>[] =
  TREND_RANGES.map(({ key, label }) => ({ value: key, label }));

// monthKey is YYYYMM (e.g. 202411); convert through a flat month count
// so subtraction carries across year boundaries.
const subtractMonths = (monthKey: number, months: number): number => {
  const flat =
    Math.floor(monthKey / 100) * 12 + ((monthKey % 100) - 1) - months;
  return Math.floor(flat / 12) * 100 + (flat % 12) + 1;
};

const filterByRange = (
  data: TrendChartDatum[],
  range: TrendRangeKey
): TrendChartDatum[] => {
  const months = TREND_RANGES.find(({ key }) => key === range)?.months;
  if (!months || data.length === 0) return data;

  // Anchor on the latest month in the data (rows are sorted ascending),
  // inclusive of that month, so "3M" always shows the newest 3 months.
  const latest = data[data.length - 1].monthKey;
  const cutoff = subtractMonths(latest, months - 1);
  return data.filter((point) => point.monthKey >= cutoff);
};

const formatMonth = (month: number) =>
  month.toString().replace(/(\d{4})(\d{2})/, "$1-$2");

const formatNumber = (value: number) =>
  value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

const formatAxisNumber = (value: number) =>
  value.toLocaleString(undefined, {
    maximumFractionDigits: value >= 1000 ? 0 : 1,
    notation: "compact",
  });

const getDisplayTrend = (trend: SiteTrendBundle): SiteTrend =>
  trend.kwh.found ? trend.kwh : trend.billAmount;

const buildChartData = (trend: SiteTrendBundle): TrendChartDatum[] => {
  const rows = new Map<number, Omit<TrendChartDatum, "month">>();

  const ensureRow = (month: number) => {
    const currentRow = rows.get(month);

    if (currentRow) return currentRow;

    const nextRow = {
      billAmount: null,
      kwh: null,
      monthKey: month,
    };

    rows.set(month, nextRow);
    return nextRow;
  };

  trend.kwh.series.forEach((point) => {
    ensureRow(point.month).kwh = point.value;
  });

  trend.billAmount.series.forEach((point) => {
    ensureRow(point.month).billAmount = point.value;
  });

  return Array.from(rows.values())
    .sort((left, right) => left.monthKey - right.monthKey)
    .map((row) => ({
      ...row,
      month: formatMonth(row.monthKey),
    }));
};

export function TrendChart({ trend, highlightMonths }: TrendChartProps) {
  const [range, setRange] = useState<TrendRangeKey>("all");

  const highlightSet = useMemo(
    () => new Set(highlightMonths ?? []),
    [highlightMonths]
  );

  const validData = useMemo(
    () =>
      buildChartData(trend).filter(
        (point) => point.kwh !== null || point.billAmount !== null
      ),
    [trend]
  );

  const visibleData = useMemo(
    () => filterByRange(validData, range),
    [validData, range]
  );

  const displayTrend = getDisplayTrend(trend);

  if (!displayTrend.found) {
    return (
      <div className="card-base flex h-96 items-center justify-center p-6">
        <p className="text-muted-foreground">Site not found</p>
      </div>
    );
  }

  // Series presence comes from the full data, not the visible slice, so
  // axes and series stay mounted while the range animates.
  const hasKwh = validData.some((point) => point.kwh !== null);
  const hasBilling = validData.some((point) => point.billAmount !== null);

  return (
    <div className="card-base p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-3 mb-4">
            <h3 className="text-2xl font-bold text-foreground">
              {displayTrend.site_id}
            </h3>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              KWH + Amount
            </span>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            {displayTrend.provider && (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Provider:</span>
                <span className="text-foreground font-semibold">
                  {displayTrend.provider}
                </span>
              </div>
            )}
            {displayTrend.company && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Company:</span>
                <span className="text-foreground font-semibold">
                  {displayTrend.company}
                </span>
              </div>
            )}
            {displayTrend.site_type && (
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground font-semibold ml-2">
                  {displayTrend.site_type}
                </span>
              </div>
            )}
          </div>
        </div>

        {validData.length > 0 && (
          <SegmentedControl
            value={range}
            onValueChange={setRange}
            options={RANGE_OPTIONS}
            aria-label="Trend date range"
          />
        )}
      </div>

      {validData.length > 0 ? (
        <div className="space-y-4">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={visibleData}
                margin={{
                  top: 10,
                  right: hasBilling ? 12 : 20,
                  left: hasKwh ? -6 : 8,
                  bottom: 0,
                }}
              >
              <defs>
                <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
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

              {hasKwh ? (
                <YAxis
                  yAxisId="kwh"
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: 12 }}
                  tick={{ fill: "var(--muted-foreground)" }}
                  tickFormatter={formatAxisNumber}
                  axisLine={{ stroke: "var(--border)" }}
                />
              ) : null}

              {hasBilling ? (
                <YAxis
                  yAxisId="billing"
                  orientation="right"
                  stroke="var(--muted-foreground)"
                  style={{ fontSize: 12 }}
                  tick={{ fill: "var(--muted-foreground)" }}
                  tickFormatter={formatAxisNumber}
                  axisLine={{ stroke: "var(--border)" }}
                />
              ) : null}

              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  boxShadow: "var(--shadow-lifted)",
                  padding: "12px 16px",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                formatter={(value, name) => [
                  // recharts passes the series `name` prop here, not the
                  // dataKey — checking against "billAmount" never matched,
                  // which is why both rows used to read "KWH"
                  typeof value === "number" ? formatNumber(value) : value,
                  name,
                ]}
                cursor={{
                  stroke: "var(--muted-foreground)",
                  strokeOpacity: 0.5,
                }}
              />

              {hasKwh ? (
                <Area
                  yAxisId="kwh"
                  type="monotone"
                  dataKey="kwh"
                  name="KWH"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#colorKwh)"
                  dot={({ key, cx, cy, payload }) =>
                    payload && highlightSet.has(payload.monthKey) ? (
                      <AnomalyPingDot key={key} cx={cx} cy={cy} />
                    ) : (
                      <CustomDot key={key} cx={cx} cy={cy} fill="var(--primary)" />
                    )
                  }
                  activeDot={{
                    r: 6,
                    fill: "var(--primary)",
                  }}
                  connectNulls
                  isAnimationActive={true}
                  animationDuration={700}
                  animationEasing="ease-in-out"
                />
              ) : null}

              {hasBilling ? (
                <Line
                  yAxisId="billing"
                  type="monotone"
                  dataKey="billAmount"
                  name="Amount"
                  stroke="var(--chart-2)"
                  strokeWidth={3}
                  dot={<CustomDot fill="var(--chart-2)" />}
                  activeDot={{
                    r: 6,
                    fill: "var(--chart-2)",
                  }}
                  connectNulls
                  isAnimationActive={true}
                  animationDuration={700}
                  animationEasing="ease-in-out"
                />
              ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
            {hasKwh ? (
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "var(--primary)" }}
                  aria-hidden="true"
                />
                <span>KWH</span>
              </div>
            ) : null}
            {hasBilling ? (
              <div className="flex items-center gap-2">
                <ReceiptText
                  className="h-3.5 w-3.5"
                  style={{ color: "var(--chart-2)" }}
                  aria-hidden="true"
                />
                <span>Amount</span>
              </div>
            ) : null}
            {hasKwh && highlightSet.size > 0 ? (
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-2 ring-destructive/30"
                  style={{ backgroundColor: "var(--destructive)" }}
                  aria-hidden="true"
                />
                <span>Anomaly month</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex h-80 items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}
    </div>
  );
}

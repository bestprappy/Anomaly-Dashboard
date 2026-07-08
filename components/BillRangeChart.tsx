"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { BillRange } from "@/lib/api";
import { getProviderColor, PROVIDER_ORDER } from "@/lib/providers";

interface BillRangeChartProps {
  billRange: BillRange;
}

interface RangeRow {
  provider: string;
  minCode: number;
  maxCode: number;
  months: number;
}

interface AxisTick {
  year: number;
  pct: number;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const isMonthCode = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value % 100 >= 1 &&
  value % 100 <= 12;

const monthIndex = (code: number) =>
  Math.floor(code / 100) * 12 + ((code % 100) - 1);

const formatMonthCode = (code: number) => {
  const label = MONTH_LABELS[(code % 100) - 1];
  return label ? `${label} ${Math.floor(code / 100)}` : String(code);
};

const MAX_AXIS_TICKS = 9;

export function BillRangeChart({ billRange }: BillRangeChartProps) {
  const rows = useMemo<RangeRow[]>(() => {
    const providerRows = PROVIDER_ORDER.flatMap((provider) => {
      const range = billRange.per_provider?.[provider];
      if (
        !range ||
        !isMonthCode(range.min_month) ||
        !isMonthCode(range.max_month) ||
        range.max_month < range.min_month
      ) {
        return [];
      }
      return [
        {
          provider,
          minCode: range.min_month,
          maxCode: range.max_month,
          months: range.n_months,
        },
      ];
    });

    if (providerRows.length > 0) return providerRows;

    // Per-provider breakdown missing — fall back to the overall range.
    if (
      isMonthCode(billRange.min_month) &&
      isMonthCode(billRange.max_month) &&
      billRange.max_month >= billRange.min_month
    ) {
      return [
        {
          provider: "All",
          minCode: billRange.min_month,
          maxCode: billRange.max_month,
          months: billRange.n_months,
        },
      ];
    }

    return [];
  }, [billRange]);

  const scale = useMemo(() => {
    if (rows.length === 0) return null;

    const start = Math.min(...rows.map((row) => monthIndex(row.minCode)));
    const end = Math.max(...rows.map((row) => monthIndex(row.maxCode)));
    const cells = Math.max(end - start + 1, 1);

    const firstYear = Math.ceil(start / 12);
    const lastYear = Math.floor((start + cells) / 12);
    const years: number[] = [];
    for (let year = firstYear; year <= lastYear; year++) years.push(year);

    const step = Math.max(1, Math.ceil(years.length / MAX_AXIS_TICKS));
    const ticks: AxisTick[] = years
      .filter((_, index) => index % step === 0)
      .map((year) => ({ year, pct: ((year * 12 - start) / cells) * 100 }))
      .filter((tick) => tick.pct >= 0 && tick.pct <= 100);

    return { start, cells, ticks };
  }, [rows]);

  return (
    <div className="card-base p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            Bill Range
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Billing data coverage by provider
          </p>
        </div>
      </div>

      {rows.length === 0 || !scale ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No bill range data available
        </p>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => {
            const startIdx = monthIndex(row.minCode);
            const endIdx = monthIndex(row.maxCode);
            const left = ((startIdx - scale.start) / scale.cells) * 100;
            const width = Math.max(
              ((endIdx - startIdx + 1) / scale.cells) * 100,
              0.75
            );
            const span = endIdx - startIdx + 1;
            const color = getProviderColor(row.provider);
            const rangeText = `${formatMonthCode(row.minCode)} → ${formatMonthCode(row.maxCode)}`;
            const monthsText =
              row.months < span
                ? `${row.months} of ${span} months`
                : `${row.months} months`;

            return (
              <div key={row.provider}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {row.provider}
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {rangeText}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {row.months} mo
                    </span>
                  </span>
                </div>

                <div
                  className="group relative h-6 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  tabIndex={0}
                  role="img"
                  aria-label={`${row.provider}: ${rangeText}, ${monthsText} of billing data`}
                >
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-[4px] bg-surface"
                  />
                  <div
                    aria-hidden
                    className="absolute top-1/2 h-3 -translate-y-1/2 rounded-[4px]"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: color,
                    }}
                  />
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
                    style={{ boxShadow: "var(--shadow-lifted)" }}
                  >
                    <span className="font-semibold">{row.provider}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {rangeText} · {monthsText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <div aria-hidden className="relative h-5">
            {scale.ticks.map((tick) => (
              <span
                key={tick.year}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${tick.pct}%` }}
              >
                <span className="h-1.5 w-px bg-border" />
                <span className="mt-1 text-[10px] font-medium leading-none tabular-nums text-muted-foreground">
                  {tick.year}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

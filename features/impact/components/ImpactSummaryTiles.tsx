"use client";

import { useMemo } from "react";
import { Banknote, CalendarRange, Flag, Zap } from "lucide-react";

import type { ImpactResponse } from "@/lib/mlApi";
import { MetricTile } from "@/components/ui/MetricTile";
import { formatCount, formatKwh } from "@/lib/format";
import { formatBaht } from "@/features/impact/format";

/** Headline tiles: total estimated cost, excess energy, pricing coverage,
 *  and the single costliest month of the test range. */

interface ImpactTotals {
  baht: number;
  kwh: number;
  anomalies: number;
  priced: number;
  worstMonth: { month: string; baht: number } | null;
}

function computeTotals(impact: ImpactResponse): ImpactTotals {
  const totals = impact.summary_by_provider.reduce(
    (acc, row) => ({
      baht: acc.baht + (Number.isFinite(row.total_estimated_baht) ? row.total_estimated_baht : 0),
      kwh: acc.kwh + (Number.isFinite(row.total_excess_kwh) ? row.total_excess_kwh : 0),
      anomalies: acc.anomalies + (Number.isFinite(row.n_anomalies) ? row.n_anomalies : 0),
      priced: acc.priced + (Number.isFinite(row.n_priced) ? row.n_priced : 0),
    }),
    { baht: 0, kwh: 0, anomalies: 0, priced: 0 }
  );

  const worstMonth = impact.summary_by_month.reduce<ImpactTotals["worstMonth"]>(
    (worst, row) =>
      Number.isFinite(row.total_estimated_baht) &&
      (worst === null || row.total_estimated_baht > worst.baht)
        ? { month: row.month, baht: row.total_estimated_baht }
        : worst,
    null
  );

  return { ...totals, worstMonth };
}

interface ImpactSummaryTilesProps {
  impact: ImpactResponse;
}

export function ImpactSummaryTiles({ impact }: ImpactSummaryTilesProps) {
  const totals = useMemo(() => computeTotals(impact), [impact]);
  const unpriced = totals.anomalies - totals.priced;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricTile
        icon={<Banknote className="h-5 w-5" />}
        label="Estimated excess cost"
        value={formatBaht(totals.baht)}
        detail="Excess kWh priced at each site's own average baht/kWh"
      />
      <MetricTile
        icon={<Zap className="h-5 w-5" />}
        label="Excess energy"
        value={`${formatKwh(totals.kwh)} kWh`}
        detail="Actual kWh above the model's expected (q50) usage"
      />
      <MetricTile
        icon={<Flag className="h-5 w-5" />}
        label="Spike-up anomalies"
        value={formatCount(totals.anomalies)}
        detail={
          unpriced > 0
            ? `${formatCount(totals.priced)} priced · ${formatCount(unpriced)} without a usable site rate`
            : "All priced from the sites' own billing history"
        }
      />
      <MetricTile
        icon={<CalendarRange className="h-5 w-5" />}
        label="Costliest month"
        value={totals.worstMonth?.month ?? "–"}
        detail={
          totals.worstMonth
            ? `${formatBaht(totals.worstMonth.baht)} of estimated excess cost`
            : "No months in the current test range"
        }
      />
    </div>
  );
}

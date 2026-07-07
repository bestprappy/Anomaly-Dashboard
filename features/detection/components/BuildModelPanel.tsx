"use client";

import { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Hammer, Loader2 } from "lucide-react";

import { NumberField } from "@/components/ui/NumberField";
import { buildPlanAtom, lastBuildAtom, quantilesAtom } from "@/features/detection/atoms";
import { BuildMetrics } from "@/features/detection/components/BuildMetrics";
import { DropReportSummary } from "@/features/detection/components/DropReportSummary";
import { ErrorNotice } from "@/features/detection/components/ErrorNotice";
import { useBuildModel } from "@/features/detection/hooks";

/**
 * Step 4 of the Process tab: quantile band settings + the expensive
 * "Build model" action (fits 3 gradient-boosting models server-side),
 * then the run's metrics.
 */

interface BuildModelPanelProps {
  disabled?: boolean;
}

export function BuildModelPanel({ disabled }: BuildModelPanelProps) {
  const [quantiles, setQuantiles] = useAtom(quantilesAtom);
  const plan = useAtomValue(buildPlanAtom);
  const lastBuild = useAtomValue(lastBuildAtom);
  const build = useBuildModel();

  const handleBuild = useCallback(() => {
    if (!plan.request || build.isPending) return;
    build.mutate(plan.request);
  }, [plan.request, build]);

  return (
    <div className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Prediction band quantiles</legend>
        <p className="text-xs text-muted-foreground">
          A month is flagged when its actual kWh lands outside the [low, high] band predicted from
          the site&apos;s history.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            label="Low quantile"
            value={quantiles.qLow}
            onChange={(qLow) => setQuantiles((current) => ({ ...current, qLow }))}
            step={0.01}
            min={0.001}
            max={0.49}
            hint="Default 0.05"
          />
          <NumberField
            label="Mid quantile"
            value={quantiles.qMid}
            onChange={(qMid) => setQuantiles((current) => ({ ...current, qMid }))}
            step={0.05}
            min={0.05}
            max={0.95}
            hint="Default 0.50 (median)"
          />
          <NumberField
            label="High quantile"
            value={quantiles.qHigh}
            onChange={(qHigh) => setQuantiles((current) => ({ ...current, qHigh }))}
            step={0.01}
            min={0.51}
            max={0.999}
            hint="Default 0.95"
          />
        </div>
      </fieldset>

      {plan.errors.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          {plan.errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleBuild}
          disabled={disabled || !plan.request || build.isPending}
          className="btn-base btn-primary"
        >
          {build.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Hammer className="h-4 w-4" aria-hidden />
          )}
          {build.isPending ? "Building model…" : "Build model"}
        </button>
        <p className="text-xs text-muted-foreground">
          Fits three quantile models on the server — this can take a few minutes on the small
          (512&nbsp;MB) instance. Leave this page open and don&apos;t re-run while one is in
          progress.
        </p>
      </div>

      {build.isError ? (
        <ErrorNotice title="Model build failed" error={build.error} onRetry={handleBuild} />
      ) : null}

      {lastBuild ? (
        <div className="space-y-5 border-t border-border pt-5">
          <BuildMetrics build={lastBuild} />
          <details className="text-sm">
            <summary className="focus-ring cursor-pointer rounded text-muted-foreground hover:text-foreground">
              Sites dropped in this run
            </summary>
            <div className="mt-3">
              <DropReportSummary report={lastBuild.drop_report} />
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}

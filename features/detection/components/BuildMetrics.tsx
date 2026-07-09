import { Activity, CheckCircle2, Flag, Rows3 } from "lucide-react";

import type { BuildResponse } from "@/lib/mlApi";
import { MetricTile } from "@/components/ui/MetricTile";
import { formatCount, formatRate, formatYyyymm } from "@/features/detection/format";

/** Post-build stat tiles: band coverage, flagged volume, row counts. */

interface BuildMetricsProps {
  build: BuildResponse;
}

export function BuildMetrics({ build }: BuildMetricsProps) {
  const { metrics } = build;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Model window:{" "}
        <span className="font-medium text-foreground">
          train {formatYyyymm(build.train_range[0])} → {formatYyyymm(build.train_range[1])}, test{" "}
          {formatYyyymm(build.test_range[0])} → {formatYyyymm(build.test_range[1])}
        </span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Test coverage"
          value={formatRate(metrics.test.coverage)}
          detail={`Share of test values inside the band · pinball p50 ${metrics.test.pinball_p50.toLocaleString()}`}
        />
        <MetricTile
          icon={<Activity className="h-5 w-5" />}
          label="Train coverage"
          value={formatRate(metrics.train.coverage)}
          detail={`Pinball p50 ${metrics.train.pinball_p50.toLocaleString()}`}
        />
        <MetricTile
          icon={<Flag className="h-5 w-5" />}
          label="Flagged anomalies"
          value={formatCount(metrics.n_flagged_test)}
          detail={`${formatRate(metrics.flagged_rate_test)} of test rows fell outside the band`}
        />
        <MetricTile
          icon={<Rows3 className="h-5 w-5" />}
          label="Rows used"
          value={formatCount(build.n_model_ready_rows)}
          detail={`${formatCount(build.n_train_rows)} train · ${formatCount(build.n_test_rows)} test`}
        />
      </div>
    </div>
  );
}

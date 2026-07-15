"use client";

import { RefreshCw } from "lucide-react";

import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { formatCount, formatRate } from "@/features/detection/format";
import { useSeverityDuration } from "@/features/detection/hooks";
import type {
  AgreementRate,
  DurationBand,
  SeverityBand,
  SeverityDurationCell,
  SeverityDurationResponse,
  SurfacedAnomType,
} from "@/lib/mlApi";

const TYPE_LABELS: Record<SurfacedAnomType, string> = {
  spike_up: "Spike up",
  step_up: "Step up",
};

const SEVERITY_HEADER_STYLES: Record<SeverityBand, string> = {
  Low: "text-info",
  Medium: "text-warning",
  High: "text-destructive",
};

type TriageLabel = "Ignore" | "Review" | "Investigate";

const TRIAGE_STYLES: Record<TriageLabel, string> = {
  Ignore: "text-muted-foreground",
  Review: "text-warning",
  Investigate: "text-destructive",
};

/** Action wording per cell: severity sets the base urgency, duration escalates it. */
const CELL_TRIAGE: Record<DurationBand, Record<SeverityBand, TriageLabel>> = {
  "Single month": { Low: "Ignore", Medium: "Review", High: "Investigate" },
  "2-3 months": { Low: "Ignore", Medium: "Review", High: "Investigate" },
  ">=4 months": { Low: "Review", Medium: "Investigate", High: "Investigate" },
};

function cellKey(duration: DurationBand, severity: SeverityBand): string {
  return `${duration}:${severity}`;
}

function heatClass(count: number, maximum: number): string {
  if (count === 0 || maximum === 0) return "bg-surface/20";
  const share = count / maximum;
  if (share >= 0.67) return "bg-primary/20";
  if (share >= 0.34) return "bg-primary/12";
  return "bg-primary/5";
}

function formatRowPercent(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatRatio(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}x`;
}

function humanizeStatus(value: string): string {
  return value.replaceAll("_", " ");
}

function confidenceInterval(rate: AgreementRate): string | null {
  const [low, high] = rate.ci95;
  if (low === null || high === null) return null;
  return `95% CI ${formatRate(low)}-${formatRate(high)}`;
}

function SummaryCounts({ data }: { data: SeverityDurationResponse }) {
  const items = [
    {
      label: "Unique Sites",
      value: data.counts.total_events,
      detail: "Duplicated monthly detections combined into single site",
    },
    {
      label: "In matrix",
      value: data.counts.matrix_events,
      detail: "Confirmed severity and duration",
    },
    {
      label: "Excluded",
      value: data.counts.excluded_from_matrix,
      detail: `${formatCount(data.counts.unconfirmed_duration_events)} unconfirmed duration`,
    },
    {
      label: "On-going",
      value: data.counts.right_censored_events,
      detail: "The event has not returned to normal before the latest available month.",
    },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Event summary">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-border bg-surface/30 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 text-2xl font-bold text-foreground">{formatCount(item.value)}</dd>
          <dd className="mt-1 text-xs text-muted-foreground">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function MatrixTable({ data }: { data: SeverityDurationResponse }) {
  const cells = new Map(
    data.cells.map((cell) => [cellKey(cell.duration_band, cell.severity_band), cell])
  );
  const maximum = Math.max(0, ...data.cells.map((cell) => cell.count));

  const getCell = (duration: DurationBand, severity: SeverityBand): SeverityDurationCell =>
    cells.get(cellKey(duration, severity)) ?? {
      duration_band: duration,
      severity_band: severity,
      count: 0,
      row_percent: 0,
    };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">Confirmed event matrix</h4>
        <p className="text-xs text-muted-foreground">Darker cells contain more events.</p>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[42rem] border-collapse text-sm">
          <caption className="sr-only">
            Event counts by duration on the rows and severity score on the columns. Each cell shows
            the recommended action; hover a cell for its share within the duration row.
          </caption>
          <thead className="bg-surface/60">
            <tr className="border-b border-border">
              <th
                scope="col"
                rowSpan={2}
                className="w-44 border-r border-border px-4 py-3 text-left font-semibold text-foreground"
              >
                {data.axes.y.label} (y-axis)
              </th>
              <th
                scope="colgroup"
                colSpan={data.axes.x.bands.length}
                className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {data.axes.x.label} (x-axis)
              </th>
            </tr>
            <tr className="border-b border-border">
              {data.axes.x.bands.map((severity) => (
                <th
                  key={severity}
                  scope="col"
                  className="border-l border-border px-4 py-3 text-center font-semibold first:border-l-0"
                >
                  <span className={SEVERITY_HEADER_STYLES[severity]}>{severity}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {data.thresholds.severity_score.bands[severity]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.axes.y.bands.map((duration) => (
              <tr key={duration} className="border-b border-border last:border-b-0">
                <th
                  scope="row"
                  className="border-r border-border bg-surface/40 px-4 py-5 text-left"
                >
                  <span className="font-semibold text-foreground">{duration}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {data.thresholds.duration.bands_months[duration]} month
                    {duration === "Single month" ? "" : "s"}
                  </span>
                </th>
                {data.axes.x.bands.map((severity) => {
                  const cell = getCell(duration, severity);
                  const triage = CELL_TRIAGE[duration][severity];
                  return (
                    <td
                      key={severity}
                      title={`${formatRowPercent(cell.row_percent)} of duration row`}
                      className={`border-l border-border px-4 py-5 text-center first:border-l-0 ${heatClass(
                        cell.count,
                        maximum
                      )}`}
                    >
                      <span className="block text-2xl font-bold tabular-nums text-foreground">
                        {formatCount(cell.count)}
                      </span>
                      <span
                        className={`mt-0.5 block text-xs font-medium ${
                          cell.count === 0 ? "text-muted-foreground" : TRIAGE_STYLES[triage]
                        }`}
                      >
                        {cell.count === 0 ? "No events" : triage}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IntuitionReport({ data }: { data: SeverityDurationResponse }) {
  const report = data.intuition_report;
  const overallCi = confidenceInterval(report.overall_agreement);

  return (
    <section aria-labelledby="duration-intuition-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h4 id="duration-intuition-heading" className="text-sm font-semibold text-foreground">
            Spike/step intuition check
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Single-month events are expected to be spikes; longer events are expected to be steps.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Overall agreement
          </p>
          <p className="text-lg font-bold text-foreground">
            {report.overall_agreement.n === 0
              ? "No confirmed events"
              : `${formatRate(report.overall_agreement.rate)} (${formatCount(
                  report.overall_agreement.successes
                )}/${formatCount(report.overall_agreement.n)})`}
          </p>
          {overallCi ? <p className="text-xs text-muted-foreground">{overallCi}</p> : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {data.axes.y.bands.map((duration) => {
          const rate = report.by_duration[duration];
          const ci = confidenceInterval(rate);
          return (
            <div key={duration} className="rounded-md border border-border bg-surface/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {duration}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Expected: {TYPE_LABELS[rate.expected_type]}
              </p>
              <p className="mt-2 text-xl font-bold text-foreground">
                {rate.n === 0 ? "No data" : formatRate(rate.rate)}
              </p>
              <p className="text-xs text-muted-foreground">
                {rate.n === 0
                  ? "No confirmed events in this row"
                  : `${formatCount(rate.successes)} of ${formatCount(rate.n)} matched`}
              </p>
              {ci ? <p className="mt-0.5 text-xs text-muted-foreground">{ci}</p> : null}
            </div>
          );
        })}
      </div>

      <p className="rounded-md border border-info/25 bg-info/5 px-4 py-3 text-xs text-muted-foreground">
        This compares two labels derived from the same billing history. It confirms consistency with
        the intuition, but it does not independently prove why usage changed.
      </p>
    </section>
  );
}

function ThresholdDetails({ data }: { data: SeverityDurationResponse }) {
  const severity = data.thresholds.severity_score;
  const duration = data.thresholds.duration;
  const classifier = data.thresholds.classifier;
  const statuses = Object.entries(data.duration_status_counts).sort(([, a], [, b]) => b - a);

  return (
    <details className="rounded-md border border-border bg-surface/20" open>
      <summary className="focus-ring cursor-pointer rounded-md px-4 py-3 text-sm font-semibold text-foreground">
        How severity and duration are calculated
      </summary>
      <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Severity score</h4>
          <p className="text-xs text-muted-foreground">
            Distance above the model&apos;s q95 prediction, measured in q05-q95 prediction-band
            widths. The score at the event&apos;s first surfaced detection determines its column.
          </p>
          <code className="block overflow-x-auto rounded bg-background px-3 py-2 text-xs text-foreground">
            {severity.formula}
          </code>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            {data.axes.x.bands.map((band) => (
              <div key={band} className="contents">
                <dt className={`font-semibold ${SEVERITY_HEADER_STYLES[band]}`}>{band}</dt>
                <dd className="text-muted-foreground">{severity.bands[band]}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Observed duration</h4>
          <p className="text-xs text-muted-foreground">
            Each site is compared with its previous {duration.baseline_months} months (at least{" "}
            {duration.minimum_baseline_months} available). An event starts at{" "}
            {formatRatio(duration.event_start_ratio)} baseline and continues while usage remains at
            least {formatRatio(duration.elevated_ratio)} baseline.
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="font-semibold text-foreground">Classifier ratios</dt>
            <dd className="text-muted-foreground">
              up {formatRatio(classifier.up_ratio)}, down {formatRatio(classifier.down_ratio)},
              sustain {formatRatio(classifier.sustain_ratio)}
            </dd>
          </dl>
          {statuses.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1" aria-label="Duration status counts">
              {statuses.map(([status, count]) => (
                <span
                  key={status}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <span className="capitalize">{humanizeStatus(status)}</span>: {formatCount(count)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </details>
  );
}

export function SeverityDurationMatrix() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useSeverityDuration();

  if (isLoading) {
    return (
      <div
        className="space-y-4"
        role="status"
        aria-busy="true"
        aria-label="Loading severity-duration matrix"
      >
        <span className="sr-only">Loading severity-duration matrix.</span>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="skeleton h-24 w-full" />
          ))}
        </div>
        <div className="skeleton h-72 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorNotice
        title="Couldn't load the severity-duration matrix"
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return (
      <div className="rounded-md border border-border bg-surface/30 p-8 text-center">
        <p className="text-sm font-medium text-foreground">No classification on the server yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Run the classification above to calculate severity and observed duration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="btn-base btn-ghost text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} aria-hidden />
          Refresh matrix
        </button>
      </div>

      <SummaryCounts data={data} />

      {data.counts.total_events === 0 ? (
        <div className="rounded-md border border-border bg-surface/30 p-4 text-sm text-muted-foreground">
          The classification found no spike-up or step-up events at the current thresholds. The
          matrix remains visible so the scoring rules can still be reviewed.
        </div>
      ) : data.counts.matrix_events === 0 ? (
        <div className="rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          Events were found, but none has enough baseline and follow-up evidence to confirm a
          duration band. They are excluded instead of being mislabeled as single-month spikes.
        </div>
      ) : null}

      <MatrixTable data={data} />
      <IntuitionReport data={data} />
      <ThresholdDetails data={data} />
    </div>
  );
}

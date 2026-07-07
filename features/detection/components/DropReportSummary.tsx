import type { DropReport } from "@/lib/mlApi";
import { ANOM_TYPE_LABELS, FALLBACK_DROP_OPTIONS } from "@/features/detection/data";
import { formatCount } from "@/features/detection/format";

/**
 * What the selected drop options actually removed. Shared by the preview
 * panel and the post-build summary (both API responses include it).
 */

const OPTION_SHORT_LABELS: Record<string, string> = Object.fromEntries(
  FALLBACK_DROP_OPTIONS.map((option) => [option.value, option.label.split(" (")[0]])
);

interface DropReportSummaryProps {
  report: DropReport;
}

export function DropReportSummary({ report }: DropReportSummaryProps) {
  const byOption = Object.entries(report.dropped_sites_by_option ?? {});

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-border bg-surface/40 p-3">
          <dt className="text-xs text-muted-foreground">Sites dropped</dt>
          <dd className="mt-1 text-lg font-bold text-foreground">
            {formatCount(report.total_sites_dropped)}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-surface/40 p-3">
          <dt className="text-xs text-muted-foreground">Sites remaining</dt>
          <dd className="mt-1 text-lg font-bold text-foreground">
            {formatCount(report.sites_remaining)}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-surface/40 p-3">
          <dt className="text-xs text-muted-foreground">Rows remaining</dt>
          <dd className="mt-1 text-lg font-bold text-foreground">
            {formatCount(report.rows_remaining)}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-surface/40 p-3">
          <dt className="text-xs text-muted-foreground">Filters applied</dt>
          <dd className="mt-1 text-lg font-bold text-foreground">
            {report.options_applied?.length ?? 0}
          </dd>
        </div>
      </dl>

      {byOption.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {byOption.map(([option, count]) => (
            <li
              key={option}
              className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground"
            >
              <span className="font-medium text-foreground">
                {OPTION_SHORT_LABELS[option] ?? ANOM_TYPE_LABELS[option] ?? option}
              </span>{" "}
              — {formatCount(count)} sites
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No exclusion filters were applied.</p>
      )}
    </div>
  );
}

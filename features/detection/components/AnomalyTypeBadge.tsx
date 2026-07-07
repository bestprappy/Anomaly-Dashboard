import type { SurfacedAnomType } from "@/lib/mlApi";
import { ANOM_TYPE_DOT_TOKENS, ANOM_TYPE_LABELS } from "@/features/detection/data";

/**
 * Identity chip for an anomaly type: fixed hue dot + text label, so the
 * type is never communicated by color alone.
 */

interface AnomalyTypeBadgeProps {
  type: SurfacedAnomType;
}

export function AnomalyTypeBadge({ type }: AnomalyTypeBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-2.5 py-0.5 text-xs font-semibold text-foreground">
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: ANOM_TYPE_DOT_TOKENS[type] }}
      />
      {ANOM_TYPE_LABELS[type] ?? type}
    </span>
  );
}

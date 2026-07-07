import type {
  ClassifyRequest,
  DropOptionsSelection,
  MlDropOption,
  SurfacedAnomType,
} from "@/lib/mlApi";

/**
 * Static metadata and defaults for the detection feature. Anything the
 * UI shows that is not fetched from the API lives here.
 */

/** Rendered if GET /api/ml/drop-options is unreachable, so the form still works. */
export const FALLBACK_DROP_OPTIONS: MlDropOption[] = [
  { value: "duplicate_site", label: "Duplicate site (same Site_ID repeated across raw files)" },
  { value: "common_site", label: "Common site (shared between PEA/MEA or between companies)" },
  { value: "shutdown_site", label: "Shutdown site (MEA is_shutdown flag)" },
  { value: "maintenance_site", label: "Maintenance site (bill_class == 'maintenance')" },
];

/** All four exclusions on by default — known-unreliable sites hurt jump detection. */
export const DEFAULT_DROP_SELECTION: DropOptionsSelection = {
  duplicate_site: true,
  common_site: true,
  shutdown_site: true,
  maintenance_site: true,
};

export interface QuantileSettings {
  qLow: number;
  qMid: number;
  qHigh: number;
}

export const DEFAULT_QUANTILES: QuantileSettings = { qLow: 0.05, qMid: 0.5, qHigh: 0.95 };

export const DEFAULT_THRESHOLDS: ClassifyRequest = { up: 1.5, down: 0.67, sustain: 1.3 };

export const SURFACED_ANOM_TYPES: SurfacedAnomType[] = ["spike_up", "step_up"];

export const ANOM_TYPE_LABELS: Record<string, string> = {
  spike_up: "Spike up",
  step_up: "Step up",
  spike_down: "Spike down",
  step_down: "Step down",
  other: "Other",
  unknown: "Unknown",
};

export const ANOM_TYPE_DESCRIPTIONS: Record<SurfacedAnomType, string> = {
  spike_up: "One-month jump that reverts back down",
  step_up: "Jump that stays high (sustained level shift)",
};

/** Fixed hue per anomaly type — color follows the entity, never its rank. */
export const ANOM_TYPE_DOT_TOKENS: Record<SurfacedAnomType, string> = {
  spike_up: "var(--chart-3)",
  step_up: "var(--chart-1)",
};

/** Kept small on purpose: each example is a server-rendered PNG (512 MB backend). */
export const EXAMPLE_LIMIT_CHOICES = [2, 4, 6, 8] as const;

export const DEFAULT_EXAMPLE_LIMIT = 4;

/** Client-side render cap so a huge anomaly list can't lock up the table. */
export const MAX_TABLE_ROWS = 100;

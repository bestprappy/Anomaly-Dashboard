import { API_BASE_URL } from "@/lib/api";
import { handleUnauthorized, withAuthHeaders } from "@/lib/auth";

/**
 * Typed client for the ML pipeline endpoints (/api/ml/*).
 *
 * The backend runs on a 512 MB instance, so callers should treat /build,
 * /examples and /plots/download as expensive: never poll them, never fire
 * them concurrently, and keep example limits small.
 */

// ---------------------------------------------------------------------------
// Request / response contracts (mirror app/ml/schemas.py + ml_routes.py)
// ---------------------------------------------------------------------------

export const DROP_OPTION_KEYS = [
  "duplicate_site",
  "common_site",
  "shutdown_site",
  "maintenance_site",
] as const;

export type DropOptionKey = (typeof DROP_OPTION_KEYS)[number];

export type DropOptionsSelection = Record<DropOptionKey, boolean>;

export interface MlDropOption {
  value: DropOptionKey;
  label: string;
}

export interface DropReport {
  options_applied: string[];
  dropped_sites_by_option: Record<string, number>;
  total_sites_dropped: number;
  sites_remaining: number;
  rows_remaining: number;
}

export interface MonthMissingRate {
  month: number;
  total_sites: number;
  missing_count: number;
  missing_rate: number;
}

export interface MissingSummary {
  start_month: number;
  end_month: number;
  n_months: number;
  avg_missing_rate: number | null;
  per_month: MonthMissingRate[];
}

export interface PreviewRequest {
  drop_options: DropOptionsSelection;
  start_month: number;
  end_month: number;
}

export interface PreviewResponse {
  drop_report: DropReport;
  missing: MissingSummary;
}

export interface BuildRequest {
  drop_options: DropOptionsSelection;
  train_start: number;
  train_end: number;
  test_start: number;
  test_end: number;
  q_low: number;
  q_mid: number;
  q_high: number;
}

export interface CoverageMetrics {
  coverage: number;
  pinball_p50: number;
}

export interface BuildMetrics {
  train: CoverageMetrics;
  test: CoverageMetrics;
  n_flagged_test: number;
  flagged_rate_test: number;
}

export interface BuildResponse {
  drop_report: DropReport;
  train_range: [number, number];
  test_range: [number, number];
  metrics: BuildMetrics;
  n_model_ready_rows: number;
  n_train_rows: number;
  n_test_rows: number;
}

export interface AbnormalRow {
  site_id: string;
  anom_month: string;
  kwh: number;
  q05: number;
  q50: number;
  q95: number;
  quantile_severity: number;
}

export interface AbnormalResponse {
  count: number;
  rows: AbnormalRow[];
}

export interface ClassifyRequest {
  up: number;
  down: number;
  sustain: number;
}

export type SurfacedAnomType = "spike_up" | "step_up";

export interface ClassifiedRow {
  site_id: string;
  anom_month: string;
  anom_val: number;
  anom_type: SurfacedAnomType;
  quantile_severity: number;
}

export interface ClassifyResponse {
  type_counts: Record<string, number>;
  surfaced_types: string[];
  rows: ClassifiedRow[];
}

export type SeverityBand = "Low" | "Medium" | "High";
export type DurationBand = "Single month" | "2-3 months" | ">=4 months";

export interface SeverityDurationAxis<TBand extends string> {
  key: string;
  label: string;
  bands: TBand[];
}

export interface SeverityDurationCell {
  duration_band: DurationBand;
  severity_band: SeverityBand;
  count: number;
  /** Percentage of confirmed events in this duration row, on a 0-100 scale. */
  row_percent: number;
}

export interface AgreementRate {
  successes: number;
  n: number;
  /** Agreement rate on a 0-1 scale; null when there are no eligible events. */
  rate: number | null;
  ci95: [number | null, number | null];
}

export interface DurationIntuitionRate extends AgreementRate {
  expected_type: SurfacedAnomType;
}

export interface SeverityDurationResponse {
  axes: {
    x: SeverityDurationAxis<SeverityBand>;
    y: SeverityDurationAxis<DurationBand>;
  };
  cells: SeverityDurationCell[];
  counts: {
    total_events: number;
    matrix_events: number;
    excluded_from_matrix: number;
    right_censored_events: number;
    unconfirmed_duration_events: number;
  };
  thresholds: {
    severity_score: {
      formula: string;
      medium_min: number;
      high_min: number;
      bands: Record<SeverityBand, string>;
    };
    duration: {
      baseline_months: number;
      minimum_baseline_months: number;
      event_start_ratio: number;
      elevated_ratio: number;
      bands_months: Record<DurationBand, string>;
    };
    classifier: {
      up_ratio: number;
      down_ratio: number;
      sustain_ratio: number;
    };
  };
  duration_status_counts: Record<string, number>;
  intuition_report: {
    n_events_total: number;
    n_events_in_matrix: number;
    n_events_excluded_unconfirmed_duration: number;
    overall_agreement: AgreementRate;
    by_duration: Record<DurationBand, DurationIntuitionRate>;
  };
}

export interface ExampleImage {
  site_id: string;
  png_base64: string;
}

/**
 * GET /api/ml/impact — cost estimate of the classified spike_up anomalies
 * (step_up is deliberately excluded server-side: a sustained level shift is
 * a new baseline, not a recoverable loss). Excess kWh over the q50
 * prediction is priced at each site's own average baht/kWh derived from its
 * clean billing history, so PEA/MEA tariff differences are respected.
 * Sites with no usable billing history get no rate — their anomalies count
 * in n_anomalies but not in n_priced or the baht totals.
 */
export interface ProviderImpactSummary {
  provider: string | null;
  n_anomalies: number;
  n_priced: number;
  total_excess_kwh: number;
  total_estimated_baht: number;
}

export interface MonthlyImpactSummary {
  /** "YYYY-MM" calendar month within the model's test range. */
  month: string;
  n_anomalies: number;
  total_excess_kwh: number;
  total_estimated_baht: number;
}

export interface ImpactResponse {
  summary_by_provider: ProviderImpactSummary[];
  summary_by_month: MonthlyImpactSummary[];
}

export interface ExamplesResponse {
  anom_type: SurfacedAnomType;
  count: number;
  plot_range: { start: string; end: string };
  images: ExampleImage[];
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * "not-ready" = 409 (no data uploaded / no model built / no classification
 * yet) — an expected state the UI renders as an empty state, not a failure.
 */
export type MlApiErrorKind = "not-ready" | "validation" | "server" | "network";

export class MlApiError extends Error {
  readonly status: number;
  readonly kind: MlApiErrorKind;

  constructor(message: string, status: number, kind: MlApiErrorKind) {
    super(message);
    this.name = "MlApiError";
    this.status = status;
    this.kind = kind;
  }
}

export function isNotReadyError(err: unknown): boolean {
  return err instanceof MlApiError && err.kind === "not-ready";
}

async function readErrorDetail(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { detail?: unknown; error?: unknown };
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.error === "string") return body.error;
    return null;
  } catch {
    return null;
  }
}

function kindForStatus(status: number): MlApiErrorKind {
  if (status === 409) return "not-ready";
  if (status === 422) return "validation";
  return "server";
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: withAuthHeaders((init?.headers as Record<string, string> | undefined) ?? {}),
    });
  } catch (err) {
    console.error(`[mlApi] network failure for ${path}`, err);
    throw new MlApiError(
      "Cannot reach the API server. Check your connection and try again.",
      0,
      "network"
    );
  }

  if (res.status === 401) {
    handleUnauthorized();
    throw new MlApiError("Session expired. Sign in again.", 401, "server");
  }

  if (!res.ok) {
    const detail = await readErrorDetail(res);
    throw new MlApiError(
      detail ?? `Request failed: ${res.status} ${res.statusText}`,
      res.status,
      kindForStatus(res.status)
    );
  }

  return res;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await request(path, init);
  try {
    return (await res.json()) as T;
  } catch {
    throw new MlApiError("The server returned an unreadable response.", res.status, "server");
  }
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

function isDropOptionKey(value: unknown): value is DropOptionKey {
  return typeof value === "string" && (DROP_OPTION_KEYS as readonly string[]).includes(value);
}

class MlApiClient {
  async getDropOptions(): Promise<MlDropOption[]> {
    const data = await requestJson<{ options?: unknown }>("/api/ml/drop-options");
    if (!Array.isArray(data.options)) {
      throw new MlApiError("Drop options response was malformed.", 200, "server");
    }
    return data.options.filter(
      (opt): opt is MlDropOption =>
        typeof opt === "object" &&
        opt !== null &&
        isDropOptionKey((opt as { value?: unknown }).value) &&
        typeof (opt as { label?: unknown }).label === "string"
    );
  }

  previewMissingRate(req: PreviewRequest): Promise<PreviewResponse> {
    return postJson<PreviewResponse>("/api/ml/preview", req);
  }

  buildModel(req: BuildRequest): Promise<BuildResponse> {
    return postJson<BuildResponse>("/api/ml/build", req);
  }

  async getAbnormal(): Promise<AbnormalResponse> {
    const data = await requestJson<AbnormalResponse>("/api/ml/abnormal");
    return { count: data.count ?? 0, rows: Array.isArray(data.rows) ? data.rows : [] };
  }

  async classify(req: ClassifyRequest): Promise<ClassifyResponse> {
    const data = await postJson<ClassifyResponse>("/api/ml/classify", req);
    return {
      type_counts: data.type_counts ?? {},
      surfaced_types: Array.isArray(data.surfaced_types) ? data.surfaced_types : [],
      rows: Array.isArray(data.rows) ? data.rows : [],
    };
  }

  /** 409s (not-ready) until the current model run has been classified. */
  async getSeverityDuration(): Promise<SeverityDurationResponse> {
    const data = await requestJson<SeverityDurationResponse>("/api/ml/severity-duration");
    return {
      ...data,
      cells: Array.isArray(data.cells) ? data.cells : [],
      duration_status_counts: data.duration_status_counts ?? {},
    };
  }

  async getExamples(anomType: SurfacedAnomType, limit: number): Promise<ExamplesResponse> {
    const params = new URLSearchParams({
      anom_type: anomType,
      limit: String(limit),
    });
    const data = await requestJson<ExamplesResponse>(`/api/ml/examples?${params}`);
    return { ...data, images: Array.isArray(data.images) ? data.images : [] };
  }

  /** 409s (not-ready) until data is uploaded, a model is built AND classified. */
  async getImpact(): Promise<ImpactResponse> {
    const data = await requestJson<ImpactResponse>("/api/ml/impact");
    return {
      summary_by_provider: Array.isArray(data.summary_by_provider) ? data.summary_by_provider : [],
      summary_by_month: Array.isArray(data.summary_by_month) ? data.summary_by_month : [],
    };
  }

  /** Server renders EVERY matching plot into a zip — heavy on a 512 MB box. */
  async downloadPlotsZip(types: SurfacedAnomType[]): Promise<Blob> {
    const params = new URLSearchParams({ types: types.join(",") });
    const res = await request(`/api/ml/plots/download?${params}`);
    return res.blob();
  }
}

export const mlApi = new MlApiClient();

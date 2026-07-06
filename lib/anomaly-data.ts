// Self-contained sample data generator for the anomaly dashboard.
// No backend: the series is produced deterministically in the browser so the
// dashboard renders identical results on every load.

export type Severity = "critical" | "warning" | "normal";

export type Point = {
  index: number;
  timestamp: Date;
  value: number;
  score: number;
  isAnomaly: boolean;
  severity: Severity;
};

// Small seeded PRNG (mulberry32) for reproducible sample data.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SERIES_LENGTH = 96; // 96 x 15-minute buckets = 24h
const METRIC = "requests/sec";

function severityFor(score: number): Severity {
  if (score >= 0.85) return "critical";
  if (score >= 0.6) return "warning";
  return "normal";
}

export function generateSeries(seed = 42): Point[] {
  const rand = mulberry32(seed);
  const start = new Date();
  start.setHours(start.getHours() - 24, 0, 0, 0);

  const points: Point[] = [];

  for (let i = 0; i < SERIES_LENGTH; i++) {
    // Baseline: daily sinusoid + light noise.
    const daily = Math.sin((i / SERIES_LENGTH) * Math.PI * 2) * 30;
    const noise = (rand() - 0.5) * 8;
    let value = 120 + daily + noise;

    // Inject a handful of spikes/dips as anomalies.
    const spike = rand();
    let score = Math.min(0.55, Math.abs(noise) / 20 + rand() * 0.15);
    if (spike > 0.93) {
      value += 60 + rand() * 50;
      score = 0.6 + rand() * 0.4;
    } else if (spike < 0.04) {
      value -= 50 + rand() * 40;
      score = 0.6 + rand() * 0.4;
    }

    value = Math.max(0, Math.round(value));
    score = Number(score.toFixed(2));
    const severity = severityFor(score);

    points.push({
      index: i,
      timestamp: new Date(start.getTime() + i * 15 * 60 * 1000),
      value,
      score,
      isAnomaly: severity !== "normal",
      severity,
    });
  }

  return points;
}

export type Summary = {
  metric: string;
  total: number;
  anomalies: number;
  critical: number;
  anomalyRate: number;
  maxScore: number;
  peakValue: number;
};

export function summarize(points: Point[]): Summary {
  const anomalies = points.filter((p) => p.isAnomaly);
  const critical = points.filter((p) => p.severity === "critical").length;
  const maxScore = points.reduce((m, p) => Math.max(m, p.score), 0);
  const peakValue = points.reduce((m, p) => Math.max(m, p.value), 0);

  return {
    metric: METRIC,
    total: points.length,
    anomalies: anomalies.length,
    critical,
    anomalyRate: points.length ? anomalies.length / points.length : 0,
    maxScore,
    peakValue,
  };
}

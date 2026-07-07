/** Display formatting helpers shared across the detection feature. */

/** 202406 -> "2024-06" */
export function formatYyyymm(value: number): string {
  const year = Math.floor(value / 100);
  const month = value % 100;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** 0.1234 -> "12.3%" */
export function formatRate(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return value.toLocaleString();
}

export function formatKwh(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

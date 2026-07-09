/** Impact-feature formatting: Thai-baht currency figures. */

/** 1234567.89 -> "฿1,234,568" — whole-baht estimate, never false precision. */
export function formatBaht(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return `฿${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** 1234567 -> "฿1.2M" — for axis ticks and tight spots. */
export function formatBahtCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return `฿${value.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}`;
}

/**
 * Display formatting helpers shared across the detection feature.
 * The implementations moved to lib/format.ts once a second feature (impact)
 * needed them; re-exported here so detection imports stay stable.
 */
export {
  formatCount,
  formatKwh,
  formatRate,
  formatYyyymm,
  parseYyyymm,
} from "@/lib/format";

/**
 * Quantile severity = how many band-widths outside the prediction band
 * the value landed. Tier label + number together, never color alone.
 */

interface SeverityBadgeProps {
  severity: number;
}

function tierFor(severity: number): { label: string; className: string } {
  if (severity >= 3) {
    return { label: "Extreme", className: "border-destructive/30 bg-destructive/10 text-destructive" };
  }
  if (severity >= 1) {
    return { label: "High", className: "border-warning/30 bg-warning/10 text-warning" };
  }
  return { label: "Mild", className: "border-info/30 bg-info/10 text-info" };
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const tier = tierFor(severity);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tier.className}`}
    >
      {tier.label}
      <span className="font-mono">{severity.toFixed(2)}</span>
    </span>
  );
}

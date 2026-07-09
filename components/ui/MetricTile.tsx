import type { ReactNode } from "react";

/** Stat tile: icon + small-caps label, a bold value, one line of detail. */

interface MetricTileProps {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}

export function MetricTile({ icon, label, value, detail }: MetricTileProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="icon" aria-hidden>
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

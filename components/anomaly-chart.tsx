"use client";

import { useId } from "react";

import type { Point } from "@/lib/anomaly-data";
import { cn } from "@/lib/utils";

const WIDTH = 900;
const HEIGHT = 240;
const PAD = 12;

export function AnomalyChart({ points }: { points: Point[] }) {
  const gradientId = useId();

  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i: number) =>
    PAD + (i / (points.length - 1)) * (WIDTH - PAD * 2);
  const y = (v: number) =>
    HEIGHT - PAD - ((v - min) / range) * (HEIGHT - PAD * 2);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");

  const area = `${line} L ${x(points.length - 1).toFixed(1)} ${HEIGHT - PAD} L ${x(0).toFixed(1)} ${HEIGHT - PAD} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-64 w-full"
      role="img"
      aria-label="Metric value over the last 24 hours with anomalies highlighted"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points
        .filter((p) => p.isAnomaly)
        .map((p) => (
          <circle
            key={p.index}
            cx={x(p.index)}
            cy={y(p.value)}
            r={5}
            className={cn(
              p.severity === "critical"
                ? "fill-destructive"
                : "fill-chart-3",
            )}
            stroke="var(--background)"
            strokeWidth={2}
          />
        ))}
    </svg>
  );
}

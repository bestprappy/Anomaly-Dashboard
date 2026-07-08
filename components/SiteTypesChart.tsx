"use client";

import { useMemo } from "react";
import { Database } from "lucide-react";
import { SiteTypes } from "@/lib/api";
import { getProviderColor, PROVIDER_ORDER } from "@/lib/providers";

interface SiteTypesChartProps {
  siteTypes: SiteTypes;
}

interface TypeEntry {
  type: string;
  count: number;
  share: number;
  widthPct: number;
}

interface ProviderSection {
  provider: string;
  total: number;
  entries: TypeEntry[];
}

const formatShare = (share: number) => {
  const pct = share * 100;
  if (pct > 0 && pct < 0.1) return "<0.1%";
  return `${pct.toFixed(1)}%`;
};

export function SiteTypesChart({ siteTypes }: SiteTypesChartProps) {
  const sections = useMemo<ProviderSection[]>(
    () =>
      PROVIDER_ORDER.flatMap((provider) => {
        const counts = siteTypes?.[provider];
        if (!counts) return [];

        const sorted = Object.entries(counts)
          .filter(
            ([, count]) =>
              typeof count === "number" && Number.isFinite(count) && count >= 0
          )
          .sort(([, a], [, b]) => b - a);
        if (sorted.length === 0) return [];

        const total = sorted.reduce((sum, [, count]) => sum + count, 0);
        const max = sorted[0][1];

        return [
          {
            provider,
            total,
            entries: sorted.map(([type, count]) => ({
              type,
              count,
              share: total > 0 ? count / total : 0,
              widthPct: max > 0 ? Math.max((count / max) * 100, 1) : 0,
            })),
          },
        ];
      }),
    [siteTypes]
  );

  return (
    <div className="card-base p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
          <Database className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold leading-tight text-foreground">
            Site Types
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Site count by type per provider
          </p>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No site type data available
        </p>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => {
            const color = getProviderColor(section.provider);

            return (
              <section
                key={section.provider}
                aria-label={`${section.provider} site types`}
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {section.provider}
                  </h4>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {section.total.toLocaleString()} sites
                  </span>
                </div>

                <ul role="list" className="space-y-0.5">
                  {section.entries.map((entry) => (
                    <li
                      key={entry.type}
                      className="-mx-2 grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)_3.5rem_2.75rem] items-center gap-x-2 rounded px-2 py-1.5 transition-colors hover:bg-surface/60 sm:gap-x-3"
                    >
                      <span
                        className="truncate text-xs font-medium text-muted-foreground"
                        title={entry.type}
                      >
                        {entry.type}
                      </span>
                      <span
                        aria-hidden
                        className="h-1.5 overflow-hidden rounded-full"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
                        }}
                      >
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${entry.widthPct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </span>
                      <span className="text-right text-xs font-semibold tabular-nums text-foreground">
                        {entry.count.toLocaleString()}
                      </span>
                      <span className="text-right text-[11px] tabular-nums text-muted-foreground">
                        {formatShare(entry.share)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

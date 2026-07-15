"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { MousePointerClick } from "lucide-react";

import { api } from "@/lib/api";
import { TrendChart } from "@/components/TrendChart";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { inspectedAnomalyAtom } from "@/features/detection/atoms";

/**
 * Trend drill-down for the detection tables (flagged and classified):
 * renders the selected site's full kWh/amount history (the dashboard's
 * TrendChart) with the flagged month marked by a glowing ping. Scrolls
 * itself into view when a site is picked, so the table click lands the
 * reader on the graph. One instance sits on each detector tab; they share
 * the selection atom, so the pick survives tab switches.
 */

export function AnomalyTrendPanel() {
  const inspected = useAtomValue(inspectedAnomalyAtom);
  const panelRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const {
    data: trend,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    // Same key the dashboard uses, so a site already viewed there is instant.
    queryKey: ["siteTrend", inspected?.siteId, "kwh-billing"],
    queryFn: () => api.getSiteTrendBundle(inspected!.siteId),
    enabled: inspected !== null,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    // Only scroll on an actual table click, not when the panel mounts with
    // a selection already made (e.g. after switching detector tabs).
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!inspected) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    panelRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [inspected]);

  const highlightMonths = useMemo(
    () => (inspected?.anomMonth != null ? [inspected.anomMonth] : []),
    [inspected]
  );

  return (
    <div ref={panelRef} className="scroll-mt-6">
      {!inspected ? (
        <div className="rounded-md border border-border bg-surface/30 p-8 text-center">
          <MousePointerClick
            className="mx-auto h-6 w-6 text-muted-foreground"
            aria-hidden
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Click a site ID in the table above to see its trend with the
            anomaly highlighted.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3" aria-busy>
          <div className="skeleton h-8 w-56" />
          <div className="skeleton h-80 w-full" />
        </div>
      ) : isError ? (
        <ErrorNotice
          title={`Couldn't load the trend for ${inspected.siteId}`}
          error={error}
          onRetry={() => refetch()}
        />
      ) : trend ? (
        <TrendChart trend={trend} highlightMonths={highlightMonths} />
      ) : null}
    </div>
  );
}

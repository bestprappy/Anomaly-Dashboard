"use client";

import { useSetAtom } from "jotai";

import { inspectedAnomalyAtom } from "@/features/detection/atoms";
import { parseYyyymm } from "@/features/detection/format";

/**
 * Site-ID cell button shared by the detection tables (flagged + classified):
 * clicking selects the site in the AnomalyTrendPanel on the same tab, which
 * then scrolls itself into view.
 */

interface SiteTrendLinkProps {
  siteId: string;
  /** Anomaly month as the API sends it ("YYYY-MM"). */
  anomMonth: string;
}

export function SiteTrendLink({ siteId, anomMonth }: SiteTrendLinkProps) {
  const setInspected = useSetAtom(inspectedAnomalyAtom);

  return (
    <button
      type="button"
      onClick={() =>
        setInspected({ siteId, anomMonth: parseYyyymm(anomMonth) })
      }
      aria-label={`Show trend for site ${siteId}, anomaly in ${anomMonth}`}
      className="focus-ring cursor-pointer rounded font-mono text-xs font-semibold text-primary underline-offset-2 transition-colors hover:underline"
    >
      {siteId}
    </button>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { ImpactResponse, isNotReadyError, mlApi } from "@/lib/mlApi";

/**
 * TanStack Query hooks for the financial-impact feature.
 *
 * Same server-load discipline as the detection hooks: no window-focus
 * refetches and no retries — /impact re-aggregates the classified frame on
 * every call.
 */

/** Exported so detection's build/classify mutations can invalidate it. */
export const IMPACT_QUERY_KEY = ["ml", "impact"] as const;

/**
 * Impact summary of the current classification. A 409 ("no data / no model
 * / no classification yet") resolves to null so the page renders a guided
 * empty state instead of an error.
 */
export function useImpactSummary() {
  return useQuery<ImpactResponse | null, Error>({
    queryKey: IMPACT_QUERY_KEY,
    queryFn: async () => {
      try {
        return await mlApi.getImpact();
      } catch (err) {
        if (isNotReadyError(err)) return null;
        throw err;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
  });
}

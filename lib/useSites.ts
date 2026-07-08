"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Shared site-ID list. Components using the same provider filter share one
 * cache entry, so the search dropdown and the example chips cost a single
 * request per session.
 */
export function useSites(provider?: string, enabled = true) {
  return useQuery({
    queryKey: ["sites", provider ?? "all"],
    queryFn: () => api.getSites(provider),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import {
  AbnormalResponse,
  BuildRequest,
  BuildResponse,
  ClassifyRequest,
  ClassifyResponse,
  ExamplesResponse,
  MlDropOption,
  PreviewRequest,
  PreviewResponse,
  SeverityDurationResponse,
  SurfacedAnomType,
  isNotReadyError,
  mlApi,
} from "@/lib/mlApi";
import { classifiedResultAtom, lastBuildAtom } from "@/features/detection/atoms";
import { IMPACT_QUERY_KEY } from "@/features/impact/hooks";

/**
 * TanStack Query hooks for the detection feature.
 *
 * The backend is a 512 MB instance, so every hook here is tuned to avoid
 * accidental load: no window-focus refetches, no retries on expensive
 * calls, and example images are garbage-collected quickly.
 */

export const ML_KEYS = {
  dropOptions: ["ml", "drop-options"] as const,
  abnormal: ["ml", "abnormal"] as const,
  severityDuration: ["ml", "severity-duration"] as const,
  examples: (anomType: SurfacedAnomType, limit: number) =>
    ["ml", "examples", anomType, limit] as const,
  examplesRoot: ["ml", "examples"] as const,
};

export function useDropOptions() {
  return useQuery<MlDropOption[], Error>({
    queryKey: ML_KEYS.dropOptions,
    queryFn: () => mlApi.getDropOptions(),
    staleTime: Infinity, // static list; never refetch
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function usePreviewMissingRate() {
  return useMutation<PreviewResponse, Error, PreviewRequest>({
    mutationFn: (req) => mlApi.previewMissingRate(req),
    retry: false,
  });
}

export function useBuildModel() {
  const queryClient = useQueryClient();
  const setLastBuild = useSetAtom(lastBuildAtom);
  const setClassified = useSetAtom(classifiedResultAtom);

  return useMutation<BuildResponse, Error, BuildRequest>({
    mutationFn: (req) => mlApi.buildModel(req),
    retry: false, // a failed 3-model fit must never auto-repeat on a small server
    onSuccess: (build) => {
      setLastBuild(build);
      // A new model invalidates every downstream result.
      setClassified(null);
      queryClient.removeQueries({ queryKey: ML_KEYS.examplesRoot });
      queryClient.removeQueries({ queryKey: ML_KEYS.severityDuration });
      queryClient.invalidateQueries({ queryKey: ML_KEYS.abnormal });
      // Server drops the classification on rebuild, so /impact 409s again.
      queryClient.removeQueries({ queryKey: IMPACT_QUERY_KEY });
    },
    onError: (error) => {
      console.error("[detection] model build failed", error);
    },
  });
}

/**
 * Flagged anomalies of the current server-side model. A 409 ("no model
 * built yet") resolves to null so the UI can render an empty state —
 * and so a page reload picks up a model built earlier in the session.
 */
export function useAbnormalAnomalies() {
  return useQuery<AbnormalResponse | null, Error>({
    queryKey: ML_KEYS.abnormal,
    queryFn: async () => {
      try {
        return await mlApi.getAbnormal();
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

export function useClassifyAnomalies() {
  const queryClient = useQueryClient();
  const setClassified = useSetAtom(classifiedResultAtom);

  return useMutation<ClassifyResponse, Error, ClassifyRequest>({
    mutationFn: (req) => mlApi.classify(req),
    retry: false,
    onSuccess: (result) => {
      setClassified(result);
      // Example plots are rendered from the classification — stale ones are wrong.
      queryClient.removeQueries({ queryKey: ML_KEYS.examplesRoot });
      queryClient.invalidateQueries({ queryKey: ML_KEYS.severityDuration });
      // The impact page prices whatever is classified — recompute it.
      queryClient.invalidateQueries({ queryKey: IMPACT_QUERY_KEY });
    },
    onError: (error) => {
      console.error("[detection] classification failed", error);
    },
  });
}

/**
 * Event-level severity x duration matrix for the current classification.
 * A 409 means there is no classification yet and resolves to the empty state.
 */
export function useSeverityDuration() {
  return useQuery<SeverityDurationResponse | null, Error>({
    queryKey: ML_KEYS.severityDuration,
    queryFn: async () => {
      try {
        return await mlApi.getSeverityDuration();
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

export function useExamplePlots(anomType: SurfacedAnomType, limit: number, enabled: boolean) {
  return useQuery<ExamplesResponse, Error>({
    queryKey: ML_KEYS.examples(anomType, limit),
    queryFn: () => mlApi.getExamples(anomType, limit),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
    gcTime: 60_000, // base64 PNGs are heavy; drop unused ones fast
  });
}

/** Fetches the all-plots zip and hands it to the browser as a download. */
export function useDownloadPlotsZip() {
  return useMutation<void, Error, SurfacedAnomType[]>({
    mutationFn: async (types) => {
      const blob = await mlApi.downloadPlotsZip(types);
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = "anomaly_plots.zip";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    retry: false,
    onError: (error) => {
      console.error("[detection] plot download failed", error);
    },
  });
}

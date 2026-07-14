"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Sparkles } from "lucide-react";
import { generateSectionSummary, isAISummaryConfigured } from "@/lib/aiSummary";

interface AISummaryProps {
  /** Section name sent to the model and used in the cache key. */
  title: string;
  /** Compact, serializable snapshot of the data the table/chart below renders. */
  data: unknown;
  className?: string;
}

/** Small stable hash so the summary regenerates only when the data changes. */
function hashPayload(payload: string): string {
  let hash = 5381;
  for (let i = 0; i < payload.length; i += 1) {
    hash = ((hash << 5) + hash + payload.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/**
 * One-paragraph Gemini summary strip rendered above a table or chart.
 * Renders nothing when the API key is not configured or there is no data,
 * so the dashboard never depends on the AI service being available.
 */
export function AISummary({ title, data, className }: AISummaryProps) {
  const dataKey = useMemo(() => {
    if (data === undefined || data === null) return null;
    try {
      return hashPayload(JSON.stringify(data));
    } catch (err) {
      console.error(`[AISummary] failed to serialize data for "${title}"`, err);
      return null;
    }
  }, [data, title]);

  const {
    data: summary,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["aiSummary", title, dataKey],
    queryFn: () => generateSectionSummary(title, data),
    enabled: isAISummaryConfigured && dataKey !== null,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    // Free-tier quota is tight; surface the error instead of retrying.
    retry: false,
  });

  if (!isAISummaryConfigured || dataKey === null) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={isFetching}
      className={`rounded-md border border-border bg-surface/50 px-4 py-3 ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          AI Summary
        </span>
      </div>

      {isFetching ? (
        <p className="mt-1.5 animate-pulse text-sm text-muted-foreground">
          Generating summary...
        </p>
      ) : error ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
          <AlertCircle aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Summary unavailable.{" "}
            {error instanceof Error ? error.message : "The AI request failed."}
          </span>
        </p>
      ) : summary ? (
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{summary}</p>
      ) : null}
    </div>
  );
}

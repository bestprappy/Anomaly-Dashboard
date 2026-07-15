"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { generateSectionSummary, isAISummaryConfigured } from "@/lib/aiSummary";

interface AISummaryProps {
  /** Section name sent to the model and used in the cache key. */
  title: string;
  /** Compact, serializable snapshot of the data the table/chart below renders. */
  data: unknown;
  /**
   * Optional section label rendered on the left, with the Generate button
   * right-aligned on the same row. Always rendered — even when the AI service
   * is unavailable — so section headings never disappear.
   */
  heading?: ReactNode;
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
 * The model highlights key figures with **double asterisks** (the only
 * markdown it is allowed). Render those spans as <strong>; an unclosed
 * trailing marker falls back to plain text.
 */
function renderSummary(text: string): ReactNode[] {
  const parts = text.split("**");
  return parts.map((part, i) =>
    i % 2 === 1 && i !== parts.length - 1 ? <strong key={i}>{part}</strong> : part
  );
}

/**
 * On-demand Gemini summary for a dashboard section. Renders a Generate
 * button (right-aligned, beside the section heading when one is provided);
 * clicking it fetches a one-paragraph summary shown in a glowing panel.
 * Without a heading it renders nothing when the API key is not configured or
 * there is no data, so the dashboard never depends on the AI service.
 */
export function AISummary({ title, data, heading, className }: AISummaryProps) {
  const dataKey = useMemo(() => {
    if (data === undefined || data === null) return null;
    try {
      return hashPayload(JSON.stringify(data));
    } catch (err) {
      console.error(`[AISummary] failed to serialize data for "${title}"`, err);
      return null;
    }
  }, [data, title]);

  // Generation is user-triggered. Remember which data snapshot was requested
  // so a filter change brings the button back instead of auto-spending quota.
  const [requestedKey, setRequestedKey] = useState<string | null>(null);
  const isRequested = dataKey !== null && requestedKey === dataKey;
  const showAI = isAISummaryConfigured && dataKey !== null;

  const {
    data: summary,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["aiSummary", title, dataKey],
    queryFn: () => generateSectionSummary(title, data),
    enabled: showAI && isRequested,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    // Free-tier quota is tight; surface the error instead of retrying.
    retry: false,
  });

  if (!heading && !showAI) return null;

  const generateButton =
    showAI && !isRequested ? (
      <button
        type="button"
        onClick={() => setRequestedKey(dataKey)}
        aria-label={`Generate AI summary for ${title}`}
        className="btn-base btn-ai px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <Sparkles aria-hidden className="h-3.5 w-3.5 flex-shrink-0" />
        Generate
      </button>
    ) : null;

  const panel =
    showAI && isRequested ? (
      <div
        role="status"
        aria-live="polite"
        aria-busy={isFetching}
        className={`ai-glow-panel px-4 py-3 ${heading ? "mt-4" : ""}`}
      >
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            AI Summary
          </span>
        </div>

        {isFetching ? (
          <p className="mt-1.5 animate-pulse text-sm text-muted-foreground">
            Generating summary...
          </p>
        ) : error ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <AlertCircle aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>
                Summary unavailable.{" "}
                {error instanceof Error ? error.message : "The AI request failed."}
              </span>
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-base btn-secondary px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <RefreshCw aria-hidden className="h-3 w-3 flex-shrink-0" />
              Retry
            </button>
          </div>
        ) : summary ? (
          <p className="ai-summary-text mt-1.5 text-sm leading-relaxed">
            {renderSummary(summary)}
          </p>
        ) : null}
      </div>
    ) : null;

  if (!heading) {
    return (
      <div className={className ?? ""}>
        {generateButton ? <div className="flex justify-end">{generateButton}</div> : panel}
      </div>
    );
  }

  return (
    <div className={className ?? ""}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="section-label">{heading}</h3>
        {generateButton}
      </div>
      {panel}
    </div>
  );
}

"use client";

import { ChangeEvent, useCallback, useId } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Download, Loader2 } from "lucide-react";

import type { SurfacedAnomType } from "@/lib/mlApi";
import {
  classifiedResultAtom,
  examplesLimitAtom,
  examplesTypeAtom,
} from "@/features/detection/atoms";
import { ErrorNotice } from "@/features/detection/components/ErrorNotice";
import {
  ANOM_TYPE_DESCRIPTIONS,
  ANOM_TYPE_LABELS,
  EXAMPLE_LIMIT_CHOICES,
  SURFACED_ANOM_TYPES,
} from "@/features/detection/data";
import { useDownloadPlotsZip, useExamplePlots } from "@/features/detection/hooks";

/**
 * Result tab step 2: example per-site plots (server-rendered PNGs) for
 * spike-up / step-up anomalies, plus a zip download of every plot.
 * Kept deliberately light — each image and the zip cost real memory on
 * the 512 MB backend.
 */

export function ExamplesGallery() {
  const [anomType, setAnomType] = useAtom(examplesTypeAtom);
  const [limit, setLimit] = useAtom(examplesLimitAtom);
  const classified = useAtomValue(classifiedResultAtom);
  const limitId = useId();

  const enabled = classified !== null;
  const examples = useExamplePlots(anomType, limit, enabled);
  const download = useDownloadPlotsZip();

  const handleLimitChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const parsed = Number.parseInt(event.target.value, 10);
      if (Number.isFinite(parsed)) setLimit(parsed);
    },
    [setLimit]
  );

  const handleDownload = useCallback(() => {
    if (download.isPending) return;
    download.mutate([...SURFACED_ANOM_TYPES]);
  }, [download]);

  if (!enabled) {
    return (
      <div className="rounded-md border border-border bg-surface/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Run a classification above to see example plots.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div
            role="radiogroup"
            aria-label="Anomaly type"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface p-1"
          >
            {SURFACED_ANOM_TYPES.map((type: SurfacedAnomType) => (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={anomType === type}
                onClick={() => setAnomType(type)}
                title={ANOM_TYPE_DESCRIPTIONS[type]}
                className={`focus-ring rounded px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  anomType === type
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ANOM_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={limitId} className="text-xs font-medium text-muted-foreground">
              Examples
            </label>
            <select
              id={limitId}
              value={limit}
              onChange={handleLimitChange}
              className="input-base py-1.5 text-sm"
            >
              {EXAMPLE_LIMIT_CHOICES.map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={download.isPending}
            className="btn-base btn-secondary"
          >
            {download.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4" aria-hidden />
            )}
            {download.isPending ? "Rendering zip…" : "Download all plots (.zip)"}
          </button>
          <p className="text-xs text-muted-foreground">
            Renders every plot server-side — can take a while.
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {ANOM_TYPE_LABELS[anomType]}: {ANOM_TYPE_DESCRIPTIONS[anomType]}.
      </p>

      {download.isError ? (
        <ErrorNotice title="Plot download failed" error={download.error} onRetry={handleDownload} />
      ) : null}

      {examples.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2" aria-busy>
          {Array.from({ length: Math.min(limit, 4) }, (_, index) => (
            <div key={index} className="skeleton h-56 w-full" />
          ))}
        </div>
      ) : examples.isError ? (
        <ErrorNotice
          title="Couldn't load example plots"
          error={examples.error}
          onRetry={() => examples.refetch()}
        />
      ) : examples.data && examples.data.images.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground">
            Plot range {examples.data.plot_range.start} → {examples.data.plot_range.end}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {examples.data.images.map((image) => (
              <figure key={image.site_id} className="card-base overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic base64 data URI; next/image cannot optimize it */}
                <img
                  src={`data:image/png;base64,${image.png_base64}`}
                  alt={`Monthly kWh trend for site ${image.site_id} showing a ${ANOM_TYPE_LABELS[anomType].toLowerCase()} anomaly`}
                  loading="lazy"
                  className="w-full bg-white"
                />
                <figcaption className="border-t border-border px-4 py-2 font-mono text-xs font-semibold text-primary">
                  {image.site_id}
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-md border border-border bg-surface/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No {ANOM_TYPE_LABELS[anomType].toLowerCase()} anomalies in this run.
          </p>
        </div>
      )}
    </div>
  );
}

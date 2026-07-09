"use client";

import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { Loader2, ScanSearch } from "lucide-react";

import { dropSelectionAtom, previewRangeAtom } from "@/features/detection/atoms";
import { DropReportSummary } from "@/features/detection/components/DropReportSummary";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { MissingRateChart } from "@/features/detection/components/MissingRateChart";
import { usePreviewMissingRate } from "@/features/detection/hooks";
import { formatYyyymm } from "@/features/detection/format";

/**
 * Step 3 of the Process tab: dry-run the drop options + date window and
 * inspect data quality (per-month missing rate) before paying for a build.
 */

interface PreviewPanelProps {
  disabled?: boolean;
}

export function PreviewPanel({ disabled }: PreviewPanelProps) {
  const previewRange = useAtomValue(previewRangeAtom);
  const dropSelection = useAtomValue(dropSelectionAtom);
  const preview = usePreviewMissingRate();

  const rangeReady = previewRange.start !== null && previewRange.end !== null;
  const rangeValid =
    rangeReady && (previewRange.start as number) <= (previewRange.end as number);

  const handlePreview = useCallback(() => {
    if (!rangeValid || preview.isPending) return;
    preview.mutate({
      drop_options: dropSelection,
      start_month: previewRange.start as number,
      end_month: previewRange.end as number,
    });
  }, [rangeValid, preview, dropSelection, previewRange.start, previewRange.end]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rangeValid ? (
            <>
              Checks{" "}
              <span className="font-medium text-foreground">
                {formatYyyymm(previewRange.start as number)} →{" "}
                {formatYyyymm(previewRange.end as number)}
              </span>{" "}
              (training start to testing end) with the filters above. Nothing is fitted.
            </>
          ) : (
            "Pick the training and testing windows first — the preview spans training start to testing end."
          )}
        </p>
        <button
          type="button"
          onClick={handlePreview}
          disabled={disabled || !rangeValid || preview.isPending}
          className="btn-base btn-secondary"
        >
          {preview.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ScanSearch className="h-4 w-4" aria-hidden />
          )}
          {preview.isPending ? "Checking…" : "Preview data quality"}
        </button>
      </div>

      {preview.isError ? (
        <ErrorNotice title="Preview failed" error={preview.error} onRetry={handlePreview} />
      ) : null}

      {preview.data ? (
        <div className="space-y-5">
          <DropReportSummary report={preview.data.drop_report} />
          <MissingRateChart missing={preview.data.missing} />
        </div>
      ) : null}
    </div>
  );
}

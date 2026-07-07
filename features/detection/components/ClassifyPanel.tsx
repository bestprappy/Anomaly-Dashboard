"use client";

import { useCallback, useMemo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Loader2, Tags } from "lucide-react";

import type { ClassifiedRow, SurfacedAnomType } from "@/lib/mlApi";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import {
  classifiedResultAtom,
  thresholdValidationAtom,
  thresholdsAtom,
} from "@/features/detection/atoms";
import { NumberField } from "@/components/ui/NumberField";
import { AnomalyTypeBadge } from "@/features/detection/components/AnomalyTypeBadge";
import { ErrorNotice } from "@/features/detection/components/ErrorNotice";
import { SeverityBadge } from "@/features/detection/components/SeverityBadge";
import { ANOM_TYPE_LABELS, MAX_TABLE_ROWS, SURFACED_ANOM_TYPES } from "@/features/detection/data";
import { formatCount, formatKwh } from "@/features/detection/format";
import { useClassifyAnomalies } from "@/features/detection/hooks";

/**
 * Result tab step 1: user-tunable UP/DOWN/SUSTAIN jump thresholds.
 * Classification is cheap (no refit), so it can be re-run freely.
 */

const COLUMNS: DataTableColumn<ClassifiedRow>[] = [
  {
    key: "site",
    header: "Site ID",
    render: (row) => (
      <span className="font-mono text-xs font-semibold text-primary">{row.site_id}</span>
    ),
  },
  { key: "month", header: "Month", render: (row) => row.anom_month },
  { key: "type", header: "Type", render: (row) => <AnomalyTypeBadge type={row.anom_type} /> },
  {
    key: "value",
    header: "kWh",
    align: "right",
    render: (row) => <span className="font-semibold">{formatKwh(row.anom_val)}</span>,
  },
  {
    key: "severity",
    header: "Severity",
    render: (row) => <SeverityBadge severity={row.quantile_severity} />,
  },
];

interface ClassifyPanelProps {
  modelReady: boolean;
}

export function ClassifyPanel({ modelReady }: ClassifyPanelProps) {
  const [thresholds, setThresholds] = useAtom(thresholdsAtom);
  const validation = useAtomValue(thresholdValidationAtom);
  const result = useAtomValue(classifiedResultAtom);
  const classify = useClassifyAnomalies();

  const handleClassify = useCallback(() => {
    if (!validation.isValid || classify.isPending) return;
    classify.mutate(thresholds);
  }, [validation.isValid, classify, thresholds]);

  const visibleRows = useMemo(() => result?.rows.slice(0, MAX_TABLE_ROWS) ?? [], [result]);

  const typeCounts = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.type_counts).sort(([, a], [, b]) => b - a);
  }, [result]);

  return (
    <div className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Jump thresholds</legend>
        <p className="text-xs text-muted-foreground">
          A flagged month is compared to the site&apos;s ~4-month median before and after it.
          Re-classifying is instant — the model is not refitted.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            label="Up ratio"
            value={thresholds.up}
            onChange={(up) => setThresholds((current) => ({ ...current, up }))}
            step={0.1}
            min={1.01}
            hint="Jump counts as up when value ≥ up × before"
            error={validation.errors.up}
          />
          <NumberField
            label="Down ratio"
            value={thresholds.down}
            onChange={(down) => setThresholds((current) => ({ ...current, down }))}
            step={0.05}
            min={0.01}
            max={0.99}
            hint="Jump counts as down when value ≤ down × before"
            error={validation.errors.down}
          />
          <NumberField
            label="Sustain ratio"
            value={thresholds.sustain}
            onChange={(sustain) => setThresholds((current) => ({ ...current, sustain }))}
            step={0.1}
            min={1.01}
            hint="Step (not spike) when the after-median stays ≥ sustain × before"
            error={validation.errors.sustain}
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleClassify}
          disabled={!modelReady || !validation.isValid || classify.isPending}
          className="btn-base btn-primary"
        >
          {classify.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Tags className="h-4 w-4" aria-hidden />
          )}
          {classify.isPending ? "Classifying…" : "Classify anomalies"}
        </button>
        {!modelReady ? (
          <p className="text-xs text-muted-foreground">
            Build a model on the Process tab first.
          </p>
        ) : null}
      </div>

      {classify.isError ? (
        <ErrorNotice title="Classification failed" error={classify.error} onRetry={handleClassify} />
      ) : null}

      {result ? (
        <div className="space-y-4 border-t border-border pt-5">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Anomaly types</h4>
            <ul className="mt-2 flex flex-wrap gap-2">
              {typeCounts.map(([type, count]) => (
                <li
                  key={type}
                  className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs"
                >
                  <span className="font-medium text-foreground">
                    {ANOM_TYPE_LABELS[type] ?? type}
                  </span>{" "}
                  <span className="text-muted-foreground">× {formatCount(count)}</span>
                </li>
              ))}
              {typeCounts.length === 0 ? (
                <li className="text-sm text-muted-foreground">No flagged anomalies to classify.</li>
              ) : null}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">
              Surfaced anomalies (
              {SURFACED_ANOM_TYPES.map(
                (type: SurfacedAnomType) => ANOM_TYPE_LABELS[type]
              ).join(" + ")}
              )
            </h4>
            {result.rows.length > MAX_TABLE_ROWS ? (
              <p className="text-xs text-muted-foreground">
                Showing the first {MAX_TABLE_ROWS} of {formatCount(result.rows.length)} rows.
              </p>
            ) : null}
            <DataTable
              columns={COLUMNS}
              rows={visibleRows}
              rowKey={(row) => `${row.site_id}-${row.anom_month}`}
              caption="Classified anomalies of the surfaced types"
              emptyMessage="No spike-up or step-up anomalies at these thresholds."
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

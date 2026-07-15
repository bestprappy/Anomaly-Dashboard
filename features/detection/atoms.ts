import { atom } from "jotai";

import type {
  BuildRequest,
  BuildResponse,
  ClassifyRequest,
  ClassifyResponse,
  DropOptionsSelection,
  SurfacedAnomType,
} from "@/lib/mlApi";
import {
  DEFAULT_DROP_SELECTION,
  DEFAULT_EXAMPLE_LIMIT,
  DEFAULT_QUANTILES,
  DEFAULT_THRESHOLDS,
  QuantileSettings,
} from "@/features/detection/data";

/** Client UI state for the detection page (server state lives in TanStack Query). */

export type DetectionTab = "process" | "result";

export interface MonthRange {
  start: number | null;
  end: number | null;
}

export const detectionTabAtom = atom<DetectionTab>("process");

export const dropSelectionAtom = atom<DropOptionsSelection>(DEFAULT_DROP_SELECTION);

export const trainRangeAtom = atom<MonthRange>({ start: null, end: null });

export const testRangeAtom = atom<MonthRange>({ start: null, end: null });

export const quantilesAtom = atom<QuantileSettings>(DEFAULT_QUANTILES);

export const thresholdsAtom = atom<ClassifyRequest>(DEFAULT_THRESHOLDS);

/** Result of the last successful build in this session (metrics display). */
export const lastBuildAtom = atom<BuildResponse | null>(null);

/** Latest classification snapshot; cleared whenever a new model is built. */
export const classifiedResultAtom = atom<ClassifyResponse | null>(null);

export interface InspectedAnomaly {
  siteId: string;
  /** Anomaly month as a YYYYMM key (matches SiteTrend series months); null if unparsable. */
  anomMonth: number | null;
}

/** Site picked from the flagged-anomalies table; drives the trend panel below it. */
export const inspectedAnomalyAtom = atom<InspectedAnomaly | null>(null);

export const examplesTypeAtom = atom<SurfacedAnomType>("spike_up");

export const examplesLimitAtom = atom<number>(DEFAULT_EXAMPLE_LIMIT);

export interface BuildPlan {
  request: BuildRequest | null;
  errors: string[];
}

/**
 * Derived selector: assembles the /api/ml/build request from the form
 * atoms and reports every validation problem in one place.
 */
export const buildPlanAtom = atom<BuildPlan>((get) => {
  const train = get(trainRangeAtom);
  const test = get(testRangeAtom);
  const quantiles = get(quantilesAtom);
  const errors: string[] = [];

  if (train.start === null || train.end === null) {
    errors.push("Pick both training window months.");
  } else if (train.start > train.end) {
    errors.push("Training start must be on or before training end.");
  }

  if (test.start === null || test.end === null) {
    errors.push("Pick both testing window months.");
  } else if (test.start > test.end) {
    errors.push("Testing start must be on or before testing end.");
  }

  if (train.end !== null && test.start !== null && test.start <= train.end) {
    errors.push("Testing window must start after the training window ends.");
  }

  const { qLow, qMid, qHigh } = quantiles;
  if (!(qLow > 0 && qLow < qMid && qMid < qHigh && qHigh < 1)) {
    errors.push("Quantiles must satisfy 0 < low < mid < high < 1.");
  }

  if (errors.length > 0) {
    return { request: null, errors };
  }

  return {
    request: {
      drop_options: get(dropSelectionAtom),
      train_start: train.start as number,
      train_end: train.end as number,
      test_start: test.start as number,
      test_end: test.end as number,
      q_low: qLow,
      q_mid: qMid,
      q_high: qHigh,
    },
    errors,
  };
});

/** Preview spans the whole candidate window: train start -> test end. */
export const previewRangeAtom = atom<MonthRange>((get) => ({
  start: get(trainRangeAtom).start,
  end: get(testRangeAtom).end,
}));

export interface ThresholdValidation {
  errors: Partial<Record<keyof ClassifyRequest, string>>;
  isValid: boolean;
}

/** Mirrors ClassifyThresholds.__post_init__ so bad input never reaches the API. */
export const thresholdValidationAtom = atom<ThresholdValidation>((get) => {
  const { up, down, sustain } = get(thresholdsAtom);
  const errors: ThresholdValidation["errors"] = {};
  if (!(up > 1)) errors.up = "Must be greater than 1";
  if (!(down > 0 && down < 1)) errors.down = "Must be between 0 and 1";
  if (!(sustain > 1)) errors.sustain = "Must be greater than 1";
  return { errors, isValid: Object.keys(errors).length === 0 };
});

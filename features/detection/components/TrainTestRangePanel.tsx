"use client";

import { useCallback } from "react";
import { useAtom } from "jotai";

import { MonthField } from "@/components/ui/MonthField";
import { MonthRange, testRangeAtom, trainRangeAtom } from "@/features/detection/atoms";

/**
 * Step 2 of the Process tab: the train/test month windows. Field-level
 * ordering errors show inline; cross-window rules surface in the build
 * panel's validation summary.
 */

interface RangeFieldsProps {
  legend: string;
  hint: string;
  range: MonthRange;
  onChange: (range: MonthRange) => void;
}

function RangeFields({ legend, hint, range, onChange }: RangeFieldsProps) {
  const orderError =
    range.start !== null && range.end !== null && range.start > range.end
      ? "Start month is after end month"
      : undefined;

  return (
    <fieldset className="space-y-3 rounded-md border border-border bg-surface/40 p-4">
      <legend className="px-1 text-sm font-semibold text-foreground">{legend}</legend>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <MonthField
          label="Start month"
          value={range.start}
          onChange={(start) => onChange({ ...range, start })}
          error={orderError}
        />
        <MonthField
          label="End month"
          value={range.end}
          onChange={(end) => onChange({ ...range, end })}
        />
      </div>
    </fieldset>
  );
}

export function TrainTestRangePanel() {
  const [trainRange, setTrainRange] = useAtom(trainRangeAtom);
  const [testRange, setTestRange] = useAtom(testRangeAtom);

  const handleTrainChange = useCallback(
    (range: MonthRange) => setTrainRange(range),
    [setTrainRange]
  );
  const handleTestChange = useCallback((range: MonthRange) => setTestRange(range), [setTestRange]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RangeFields
        legend="Training window"
        hint="Months the quantile model learns normal behaviour from. Sites need ≥ 7 consecutive clean months."
        range={trainRange}
        onChange={handleTrainChange}
      />
      <RangeFields
        legend="Testing window"
        hint="Months scanned for anomalies. Must start after the training window ends."
        range={testRange}
        onChange={handleTestChange}
      />
    </div>
  );
}

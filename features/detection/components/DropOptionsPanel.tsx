"use client";

import { useCallback } from "react";
import { useAtom } from "jotai";
import { AlertTriangle } from "lucide-react";

import type { DropOptionKey } from "@/lib/mlApi";
import { dropSelectionAtom } from "@/features/detection/atoms";
import { FALLBACK_DROP_OPTIONS } from "@/features/detection/data";
import { useDropOptions } from "@/features/detection/hooks";

/**
 * Step 1 of the Process tab: which unreliable site categories to remove
 * before fitting. Labels come from the API; a static fallback keeps the
 * form usable if that call fails.
 */

export function DropOptionsPanel() {
  const { data, isLoading, error } = useDropOptions();
  const [selection, setSelection] = useAtom(dropSelectionAtom);

  const toggle = useCallback(
    (key: DropOptionKey) => {
      setSelection((current) => ({ ...current, [key]: !current[key] }));
    },
    [setSelection]
  );

  const options = data && data.length > 0 ? data : FALLBACK_DROP_OPTIONS;

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Site exclusion filters</legend>
      <p className="text-sm text-muted-foreground">
        Each selected filter removes the site&apos;s entire history from the model. All four are
        recommended — these sites have unreliable series that hurt jump detection.
      </p>

      {error ? (
        <p className="flex items-center gap-2 text-xs text-warning" role="status">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
          Couldn&apos;t load filter labels from the server — showing built-in defaults.
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-2" aria-hidden>
          {FALLBACK_DROP_OPTIONS.map((option) => (
            <div key={option.value} className="skeleton h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface/40 p-3 transition-colors hover:bg-surface/70"
            >
              <input
                type="checkbox"
                checked={selection[option.value]}
                onChange={() => toggle(option.value)}
                className="focus-ring mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="text-sm text-foreground">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

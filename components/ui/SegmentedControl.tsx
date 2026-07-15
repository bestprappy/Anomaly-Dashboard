"use client";

import { KeyboardEvent, useCallback, useRef } from "react";

/**
 * Single-select segmented control (controlled).
 *
 * <SegmentedControl
 *   value={range}
 *   onValueChange={setRange}
 *   options={[{ value: "3m", label: "3M" }, ...]}
 *   aria-label="Date range"
 * />
 *
 * Implements the WAI-ARIA radio-group pattern: roving tabindex,
 * arrow-key / Home / End navigation with selection-on-focus. The
 * selected segment is marked by a thumb that slides between equal-width
 * segments (disabled under prefers-reduced-motion).
 */

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly SegmentedControlOption<T>[];
  "aria-label": string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  const selectIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;

      onValueChange(option.value);

      const radios = groupRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]'
      );
      radios?.[index]?.focus();
    },
    [options, onValueChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      let nextIndex: number;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = (selectedIndex + 1) % options.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = (selectedIndex - 1 + options.length) % options.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = options.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      selectIndex(nextIndex);
    },
    [selectedIndex, options.length, selectIndex]
  );

  if (options.length === 0) return null;

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={`relative inline-grid grid-flow-col auto-cols-fr rounded-md border border-border bg-surface p-1 ${
        className ?? ""
      }`}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-1 left-1 top-1 rounded bg-card shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${selectedIndex * 100}%)`,
        }}
      />
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            className={`relative z-10 cursor-pointer rounded px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus-ring ${
              isSelected
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

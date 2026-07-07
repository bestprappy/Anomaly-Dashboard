"use client";

import { KeyboardEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Month picker bound to the backend's YYYYMM integer convention
 * (e.g. 202406). Uses a shadcn-style popover month grid and converts
 * values both ways; clearing the picker maps to null.
 */

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function yyyymmToInputValue(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "";
  const year = Math.floor(value / 100);
  const month = value % 100;
  if (year < 1000 || month < 1 || month > 12) return "";
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function inputValueToYyyymm(value: string): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 100 + Number(match[2]);
}

function currentYear(): number {
  return new Date().getFullYear();
}

function currentYyyymm(): number {
  const today = new Date();
  return today.getFullYear() * 100 + today.getMonth() + 1;
}

function yearFromYyyymm(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const year = Math.floor(value / 100);
  const month = value % 100;
  return year >= 1000 && month >= 1 && month <= 12 ? year : null;
}

function monthIndexFromYyyymm(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const month = value % 100;
  return month >= 1 && month <= 12 ? month - 1 : null;
}

function yyyymmFromYearMonth(year: number, monthIndex: number): number {
  return year * 100 + monthIndex + 1;
}

function formatMonthLabel(value: number | null): string {
  const year = yearFromYyyymm(value);
  const monthIndex = monthIndexFromYyyymm(value);
  if (year === null || monthIndex === null) return "Pick month";
  return `${MONTH_LABELS[monthIndex]} ${year}`;
}

interface MonthFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export function MonthField({ label, value, onChange, hint, error, disabled }: MonthFieldProps) {
  const id = useId();
  const fieldRef = useRef<HTMLDivElement>(null);
  const monthButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const preferredFocusMonthRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [displayYear, setDisplayYear] = useState(yearFromYyyymm(value) ?? currentYear());
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const selectedMonthIndex = monthIndexFromYyyymm(value);
  const selectedYear = yearFromYyyymm(value);
  const todayYyyymm = useMemo(() => currentYyyymm(), []);

  const focusMonth = useCallback((monthIndex: number) => {
    window.setTimeout(() => monthButtonRefs.current[monthIndex]?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const preferredFocusIndex = preferredFocusMonthRef.current;
    preferredFocusMonthRef.current = null;
    const focusIndex =
      preferredFocusIndex ??
      (selectedYear === displayYear && selectedMonthIndex !== null ? selectedMonthIndex : 0);
    focusMonth(focusIndex);
  }, [displayYear, focusMonth, isOpen, selectedMonthIndex, selectedYear]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const selectMonth = useCallback(
    (monthIndex: number) => {
      onChange(yyyymmFromYearMonth(displayYear, monthIndex));
      setIsOpen(false);
    },
    [displayYear, onChange]
  );

  const handleTriggerClick = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setDisplayYear(yearFromYyyymm(value) ?? currentYear());
    setIsOpen(true);
  }, [isOpen, value]);

  const handleMonthKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, monthIndex: number) => {
      let nextMonthIndex = monthIndex;
      let yearDelta = 0;

      switch (event.key) {
        case "ArrowRight":
          nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;
          yearDelta = monthIndex === 11 ? 1 : 0;
          break;
        case "ArrowLeft":
          nextMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
          yearDelta = monthIndex === 0 ? -1 : 0;
          break;
        case "ArrowDown":
          nextMonthIndex = monthIndex + 3 > 11 ? monthIndex : monthIndex + 3;
          break;
        case "ArrowUp":
          nextMonthIndex = monthIndex - 3 < 0 ? monthIndex : monthIndex - 3;
          break;
        case "Home":
          nextMonthIndex = 0;
          break;
        case "End":
          nextMonthIndex = 11;
          break;
        case "PageUp":
          yearDelta = -1;
          break;
        case "PageDown":
          yearDelta = 1;
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          return;
        default:
          return;
      }

      event.preventDefault();
      if (yearDelta !== 0) {
        preferredFocusMonthRef.current = nextMonthIndex;
        setDisplayYear((year) => year + yearDelta);
      } else {
        focusMonth(nextMonthIndex);
      }
    },
    [focusMonth]
  );

  return (
    <div ref={fieldRef} className="relative flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-describedby={describedBy}
        onClick={handleTriggerClick}
        className={cx(
          "input-base flex w-full items-center justify-between gap-3 text-left",
          "focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:outline-none",
          value === null && "text-muted-foreground",
          error && "border-destructive/60",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="truncate">{formatMonthLabel(value)}</span>
        </span>
        <ChevronRight
          className={cx(
            "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform",
            isOpen && "rotate-90"
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label={`${label} picker`}
          className="absolute left-0 top-full z-50 mt-2 w-72 rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-[var(--shadow-floating)]"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous year"
              onClick={() => setDisplayYear((year) => year - 1)}
              className="btn-base btn-ghost h-9 w-9 justify-center p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-foreground">{displayYear}</p>
            <button
              type="button"
              aria-label="Next year"
              onClick={() => setDisplayYear((year) => year + 1)}
              className="btn-base btn-ghost h-9 w-9 justify-center p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2" aria-label={`Months in ${displayYear}`}>
            {MONTH_LABELS.map((monthLabel, monthIndex) => {
              const monthValue = yyyymmFromYearMonth(displayYear, monthIndex);
              const isSelected = monthValue === value;
              const isCurrent = monthValue === todayYyyymm;

              return (
                <button
                  key={monthLabel}
                  ref={(node) => {
                    monthButtonRefs.current[monthIndex] = node;
                  }}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => selectMonth(monthIndex)}
                  onKeyDown={(event) => handleMonthKeyDown(event, monthIndex)}
                  className={cx(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-foreground hover:bg-primary/10 hover:text-primary",
                    !isSelected && isCurrent && "ring-1 ring-primary/30"
                  )}
                >
                  {monthLabel}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              disabled={value === null}
              className="btn-base btn-ghost px-2 py-1.5 text-xs disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn-base btn-secondary px-2 py-1.5 text-xs"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

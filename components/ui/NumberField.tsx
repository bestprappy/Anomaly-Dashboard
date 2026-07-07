"use client";

import { ChangeEvent, useCallback, useId, useState } from "react";

/**
 * Numeric input that keeps its own text state so partial entries like
 * "0." or "-" don't get clobbered mid-typing; the numeric onChange only
 * fires for parseable values.
 */

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export function NumberField({
  label,
  value,
  onChange,
  step = 0.01,
  min,
  max,
  hint,
  error,
  disabled,
}: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState<string>(String(value));
  const [lastValue, setLastValue] = useState<number>(value);

  // Adopt external value changes (e.g. a "reset to defaults") without
  // fighting the user while they type an equivalent number.
  if (value !== lastValue) {
    setLastValue(value);
    if (Number.parseFloat(text) !== value) setText(String(value));
  }

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setText(next);
      const parsed = Number.parseFloat(next);
      if (Number.isFinite(parsed)) onChange(parsed);
    },
    [onChange]
  );

  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={text}
        onChange={handleChange}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`input-base w-full ${error ? "border-destructive/60" : ""}`}
      />
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

"use client";

import { cn } from "@/lib/cn";

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className,
  ...aria
}: QuantityStepperProps) {
  const clampAndSet = (n: number) => onChange(Math.max(min, Math.min(max, n)));

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center rounded-md border border-line bg-surface",
        disabled && "opacity-50",
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => clampAndSet(value - 1)}
        aria-label="Decrease quantity"
        className="flex h-full w-9 items-center justify-center text-ink-2 disabled:pointer-events-none disabled:opacity-40 hover:bg-surface-2 rounded-l-md"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        role="spinbutton"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={aria["aria-label"] ?? "Quantity"}
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^0-9]/g, ""));
          if (Number.isFinite(n) && e.target.value !== "") clampAndSet(n);
        }}
        className="tabular-nums w-9 border-x border-line bg-transparent text-center text-sm font-semibold text-ink outline-none"
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => clampAndSet(value + 1)}
        aria-label="Increase quantity"
        className="flex h-full w-9 items-center justify-center text-ink-2 disabled:pointer-events-none disabled:opacity-40 hover:bg-surface-2 rounded-r-md"
      >
        +
      </button>
    </div>
  );
}

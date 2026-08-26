"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

function StarIcon({ fillPct }: { fillPct: number }) {
  const id = useId();
  return (
    <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fillPct}%`} stopColor="var(--color-citrus)" />
          <stop offset={`${fillPct}%`} stopColor="var(--color-line)" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M10 1.5l2.59 5.25 5.79.84-4.19 4.08.99 5.77L10 14.9l-5.18 2.54.99-5.77L1.62 7.6l5.79-.84L10 1.5z"
      />
    </svg>
  );
}

export interface RatingProps {
  /** Average rating, 0–5. When there is no review data at all, don't render this component rather
   * than passing 0 (CLAUDE.md's "invent nothing" rule — a fake empty-star row still asserts "no
   * rating" that reads as a real, if low, rating). */
  value: number;
  /** Number of reviews backing the average, shown alongside the stars when provided. */
  count?: number;
  className?: string;
}

/** Read-only star rating. Renders nothing visually deceptive — partial stars are a real gradient
 * fill proportional to the value, not rounded up. */
export function Rating({ value, count, className }: RatingProps) {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      role="img"
      aria-label={`Rated ${clamped.toFixed(1)} out of 5${count != null ? ` from ${count} review${count === 1 ? "" : "s"}` : ""}`}
    >
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => {
          const fillPct = Math.max(0, Math.min(1, clamped - i)) * 100;
          return <StarIcon key={i} fillPct={fillPct} />;
        })}
      </span>
      {count != null && (
        <span className="tabular-nums text-xs text-ink-3">({count})</span>
      )}
    </div>
  );
}

export interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  name?: string;
  "aria-label"?: string;
  className?: string;
}

/** Interactive star rating for review forms — a real radiogroup of 5 radio buttons under the
 * hood, so arrow keys, Tab, and screen readers all behave exactly like any other radio group. */
export function RatingInput({ value, onChange, name, className, ...aria }: RatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div
      role="radiogroup"
      aria-label={aria["aria-label"] ?? "Rating"}
      className={cn("inline-flex items-center gap-1", className)}
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const filled = star <= display;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            name={name}
            tabIndex={star === value || (value === 0 && star === 1) ? 0 : -1}
            onMouseEnter={() => setHovered(star)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(null)}
            onClick={() => onChange(star)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                onChange(Math.min(5, (value || 0) + 1));
              } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                onChange(Math.max(1, (value || 1) - 1));
              }
            }}
            className="rounded-sm p-0.5"
          >
            <svg viewBox="0 0 20 20" className="size-6" aria-hidden="true">
              <path
                fill={filled ? "var(--color-citrus)" : "var(--color-line)"}
                stroke={filled ? "var(--color-citrus)" : "var(--color-ink-3)"}
                strokeWidth="0.5"
                d="M10 1.5l2.59 5.25 5.79.84-4.19 4.08.99 5.77L10 14.9l-5.18 2.54.99-5.77L1.62 7.6l5.79-.84L10 1.5z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

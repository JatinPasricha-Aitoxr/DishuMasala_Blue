import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "ok" | "warn" | "crit" | "gold";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  ok: "bg-ok/10 text-ok",
  warn: "bg-warn/10 text-warn",
  crit: "bg-crit/10 text-crit",
  gold: "bg-gold/10 text-gold",
};

/** A small status/label pill — semantic tones only (CLAUDE.md §5.2's status colours), never an
 * arbitrary color. For product-family accents use Chip instead. */
export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold tracking-[0.02em]",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}

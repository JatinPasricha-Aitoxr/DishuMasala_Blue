import type { CSSProperties } from "react";
import { PLACEHOLDER_MANIFEST, type PlaceholderSlot, type PlaceholderTone } from "@/content/placeholders";
import { cn } from "@/lib/cn";

const TONE_STYLE: Record<PlaceholderTone, CSSProperties> = {
  flat: { backgroundColor: "var(--color-surface-2)" },
  "flat-warm": { backgroundColor: "var(--color-line)" },
  "brew-cool": { backgroundImage: "var(--gradient-brew-cool)" },
};

export interface PlaceholderProps {
  slot: PlaceholderSlot;
  className?: string;
}

/**
 * The single render point for every placeholder image slot in content/placeholders.ts. Always a
 * flat token-colored rectangle — no text, no logo, no badge, no certification mark, no face
 * (CLAUDE.md §8) — sized up front from the manifest's aspect ratio so nothing shifts when a real
 * photo eventually replaces it. Decorative only (aria-hidden): it stands for a photo that doesn't
 * exist yet, so it has nothing of its own to announce to a screen reader.
 */
export function Placeholder({ slot, className }: PlaceholderProps) {
  const entry = PLACEHOLDER_MANIFEST[slot];
  return (
    <div
      aria-hidden="true"
      data-placeholder-slot={slot}
      className={cn("w-full rounded-md", className)}
      style={{ aspectRatio: entry.aspectRatio, ...TONE_STYLE[entry.tone] }}
    />
  );
}

import { cn } from "@/lib/cn";

export interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  heading: string;
  body?: string;
  /** Eyebrow colour — a token utility class (e.g. "text-brew-2", "text-hibiscus"). Never a hex
   * literal at the call site. Must clear 4.5:1 on white/ivory at this text's size (CLAUDE.md §5.6):
   * brew-2, hibiscus, leaf, chilli, pepper, ink and ink-2 all do; turmeric, coriander and gold do
   * not (they were designed as dot/chip/background accents, not small text) — use ink-2 for any
   * section without one clean, high-contrast family colour of its own. */
  accentClassName?: string;
  align?: "left" | "center";
  className?: string;
  /** "dark" (default) is ink text for a light/ivory background. "light" is white text for a
   * saturated colour background (e.g. Red Tea's scroll-shifted band) — overrides accentClassName
   * with a white-on-colour-safe eyebrow tone, since a family-accent colour like "text-hibiscus"
   * would be invisible against its own background. */
  tone?: "dark" | "light";
}

/** Shared eyebrow + Fraunces heading + optional body copy block, used by every homepage section
 * below the hero so the type scale (CLAUDE.md §5.3) stays identical across the page. */
export function SectionHeading({
  id,
  eyebrow,
  heading,
  body,
  accentClassName = "text-brew-2",
  align = "left",
  className,
  tone = "dark",
}: SectionHeadingProps) {
  const isLight = tone === "light";
  return (
    <div className={cn("flex flex-col gap-3", align === "center" && "items-center text-center", className)}>
      <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", isLight ? "text-white/80" : accentClassName)}>
        {eyebrow}
      </p>
      <h2
        id={id}
        className={cn("font-display font-semibold", isLight ? "text-white" : "text-ink")}
        style={{ fontSize: "clamp(1.75rem, 3vw, 2.75rem)", letterSpacing: "-0.015em", lineHeight: 1.1 }}
      >
        {heading}
      </h2>
      {body && <p className={cn("max-w-2xl text-base leading-relaxed", isLight ? "text-white/90" : "text-ink-2")}>{body}</p>}
    </div>
  );
}

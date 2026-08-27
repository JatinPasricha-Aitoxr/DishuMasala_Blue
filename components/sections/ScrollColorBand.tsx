"use client";

import { useEffect, useRef } from "react";

type Rgb = readonly [number, number, number];

function hexToRgb(hex: string): Rgb {
  const clean = hex.trim().replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpRgb(a: Rgb, b: Rgb, t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r} ${g} ${bl})`;
}

export interface ScrollColorBandProps {
  /** CSS custom property names (e.g. "--color-brew-2"), not raw hex — resolved at runtime via
   * getComputedStyle so this component never hardcodes a colour literal (CLAUDE.md §5.2's tokens
   * stay the single source of truth; a grep for hex literals across components/ must stay empty). */
  fromVar: string;
  toVar: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * A section background that shifts colour as it scrolls through the viewport — the "Lemon Shift"
 * idea (blue turning toward magenta/red) applied to the Blue Tea → Red Tea section handoff per
 * client request, rather than the removed hero. Progress `t` is 0 when the section's top edge is
 * at the bottom of the viewport (about to enter) and 1 when its bottom edge reaches the top of the
 * viewport (about to leave) — one full pass down the page shifts the colour the whole way from
 * `fromVar` to `toVar`. Two sections using matching endpoints (this one's `toVar` = the next one's
 * `fromVar`) read as one continuous colour journey down the page.
 *
 * `prefers-reduced-motion: reduce` renders a static, finished `fromVar` background instead of
 * tracking scroll (CLAUDE.md §5.5) — a real, intentional brand colour, not a broken/frozen mid-tween
 * state.
 */
export function ScrollColorBand({ fromVar, toVar, children, className }: ScrollColorBandProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const style = getComputedStyle(document.documentElement);
    const from = hexToRgb(style.getPropertyValue(fromVar));
    const to = hexToRgb(style.getPropertyValue(toVar));

    let ticking = false;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const total = Math.max(1, rect.height + vh);
      const scrolled = vh - rect.top;
      const t = Math.max(0, Math.min(1, scrolled / total));
      el.style.backgroundColor = lerpRgb(from, to, t);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [fromVar, toVar]);

  return (
    <div ref={ref} className={className} style={{ backgroundColor: `var(${fromVar})` }}>
      {children}
    </div>
  );
}

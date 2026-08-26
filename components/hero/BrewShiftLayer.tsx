"use client";

import { useEffect, useRef, useState } from "react";
import { HOME_COPY } from "@/content/home";

/**
 * The hero's interactive enhancement layer — dynamically imported with `ssr: false` from
 * LemonShiftHero.tsx, so it never ships in the server HTML and only ever mounts client-side, after
 * hydration, and only when the visitor hasn't asked for reduced motion. It takes over the exact same
 * visual region LemonShiftHero already server-rendered a static "blue at rest" gradient into
 * (PROMPTS.md Phase 2: "Blue gradient brew at rest"), starting from that same resting colour pair —
 * app/globals.css's `--brew-near` / `--brew-far` `@property` initial values match --color-brew-1/2
 * exactly — so there is no flash at mount, only a smooth, eased continuation.
 *
 * Two inputs move the same single progress value `t` (0–1): scrolling the hero out of view, and
 * dragging the lemon-wedge slider. Both are combined with `Math.max` — either one can push the brew
 * forward toward the citrus rim, neither can undo what the other already showed — so the effect is
 * discoverable by touch and still plays for a visitor who never touches anything.
 *
 * No canvas, no per-frame JS colour math beyond a handful of arithmetic ops on `t`. The actual
 * animation is a native CSS transition on two `@property`-registered `<color>` custom properties
 * (globals.css's `.brew-shift-blob`), so the browser's compositor does the interpolation — this is
 * what keeps this chunk's JS tiny (CLAUDE.md §11 / PROMPTS.md Phase 2: hero client JS ≤ 12KB gzip).
 */

// CLAUDE.md §5.2's --gradient-lemon-shift stop positions (0%, 20%, 45%, 68%, 86%, 100%), expressed
// as fractions — structural to the brand gradient, not a colour literal.
const STOP_POSITIONS = [0, 0.2, 0.45, 0.68, 0.86, 1] as const;
const STOP_VARS = [
  "--color-brew-1",
  "--color-brew-2",
  "--color-brew-3",
  "--color-brew-4",
  "--color-brew-5",
  "--color-citrus",
] as const;

type Rgb = readonly [number, number, number];

function hexToRgb(hex: string): Rgb {
  const clean = hex.trim().replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(a: Rgb, b: Rgb, t: number): string {
  return `rgb(${Math.round(lerp(a[0], b[0], t))} ${Math.round(lerp(a[1], b[1], t))} ${Math.round(lerp(a[2], b[2], t))})`;
}

/** Piecewise-linear sample of the six brew stops at position `t` (0–1). */
function sampleBrew(stops: Rgb[], t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < STOP_POSITIONS.length - 1; i += 1) {
    const p0 = STOP_POSITIONS[i];
    const p1 = STOP_POSITIONS[i + 1];
    if (clamped <= p1) {
      const localT = p1 === p0 ? 0 : (clamped - p0) / (p1 - p0);
      return lerpRgb(stops[i], stops[i + 1], localT);
    }
  }
  return lerpRgb(stops[stops.length - 2], stops[stops.length - 1], 1);
}

function computeScrollProgress(heroEl: HTMLElement): number {
  const rect = heroEl.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const scrolledPast = -rect.top;
  const total = Math.max(1, rect.height - vh * 0.15);
  return Math.max(0, Math.min(1, scrolledPast / total));
}

function LemonWedgeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2a10 10 0 0 1 8.66 15L12 12 3.34 17A10 10 0 0 1 12 2Z"
        fill="var(--color-citrus)"
        stroke="var(--color-ink)"
        strokeOpacity="0.12"
        strokeWidth="1"
      />
      <path
        d="M12 12 6.3 15.4M12 12 9.2 17.2M12 12l3.6 4.8M12 12l5.8-1.9"
        stroke="var(--color-surface)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

export function BrewShiftLayer() {
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [sliderValue, setSliderValue] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const rimRef = useRef<HTMLDivElement>(null);
  const stopsRef = useRef<Rgb[] | null>(null);
  const autoTRef = useRef(0);
  const sliderTRef = useRef(0);

  const applyT = (t: number) => {
    const stops = stopsRef.current;
    const blob = blobRef.current;
    const rim = rimRef.current;
    if (!stops || !blob || !rim) return;
    const near = sampleBrew(stops, Math.max(0, t - 0.16));
    const far = sampleBrew(stops, Math.min(1, t + 0.16));
    blob.style.setProperty("--brew-near", near);
    blob.style.setProperty("--brew-far", far);
    rim.style.opacity = String(Math.max(0, Math.min(1, (t - 0.82) / 0.18)));
  };

  useEffect(() => {
    if (reducedMotion) return;

    const style = getComputedStyle(document.documentElement);
    stopsRef.current = STOP_VARS.map((v) => hexToRgb(style.getPropertyValue(v)));

    const root = rootRef.current;
    const heroEl = root?.closest<HTMLElement>("[data-hero]") ?? null;
    if (!heroEl) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        autoTRef.current = computeScrollProgress(heroEl);
        applyT(Math.max(autoTRef.current, sliderTRef.current));
        ticking = false;
      });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          window.addEventListener("scroll", onScroll, { passive: true });
          onScroll();
        } else {
          window.removeEventListener("scroll", onScroll);
        }
      },
      { threshold: 0 },
    );
    io.observe(heroEl);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setSliderValue(v);
    sliderTRef.current = v / 100;
    applyT(Math.max(autoTRef.current, sliderTRef.current));
  };

  return (
    <div ref={rootRef} className="contents">
      <div
        ref={blobRef}
        aria-hidden="true"
        className="brew-shift-blob pointer-events-none absolute -inset-[18%] rounded-[38%_62%_63%_37%/41%_44%_56%_59%] opacity-70 blur-2xl"
      />
      <div
        ref={rimRef}
        aria-hidden="true"
        style={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-[1100ms] ease-[cubic-bezier(.2,.6,.2,1)]"
      >
        <div
          className="absolute -inset-1 rounded-lg shadow-[0_0_0_3px_var(--color-citrus)]"
          aria-hidden="true"
        />
      </div>

      <div className="absolute inset-x-6 -bottom-4 z-20 flex items-center gap-3 rounded-full border border-line bg-surface/95 px-4 py-3 shadow-card backdrop-blur-sm sm:inset-x-10">
        <LemonWedgeIcon className="size-6 shrink-0" />
        <div className="flex-1">
          <label htmlFor="brew-shift-slider" className="sr-only">
            {HOME_COPY.hero.sliderLabel} — shift the brew colour
          </label>
          <input
            id="brew-shift-slider"
            type="range"
            min={0}
            max={100}
            step={1}
            value={sliderValue}
            onChange={handleSliderChange}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-citrus [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-citrus [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-citrus [&::-webkit-slider-thumb]:shadow-card"
          />
        </div>
        <span className="hidden shrink-0 text-xs font-medium text-ink-2 sm:inline">
          {HOME_COPY.hero.sliderLabel}
        </span>
      </div>
    </div>
  );
}

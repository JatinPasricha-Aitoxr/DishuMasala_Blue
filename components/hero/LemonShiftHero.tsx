import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Placeholder } from "@/components/media/Placeholder";
import { BrewShiftLayerLazy as BrewShiftLayer } from "./BrewShiftLayerLazy";
import { HOME_COPY } from "@/content/home";

// The interactive brew-shift layer is a pure progressive enhancement over the static gradient
// rendered directly below — ssr:false (in BrewShiftLayerLazy.tsx) keeps it out of the server HTML
// entirely (PROMPTS.md Phase 2: "the canvas mounts only after hydration"), and it decides for
// itself, on mount, whether prefers-reduced-motion allows it to render at all
// (components/hero/BrewShiftLayer.tsx). No loading placeholder is passed: it renders only
// `position: absolute` children inside a `display: contents` wrapper, so its absence before
// hydration causes zero layout shift.

/**
 * The homepage hero (Phase 2 / PROMPTS.md, CLAUDE.md §5.4). Full-viewport, ivory ground, copy left
 * / packshot right. The LCP element is the Fraunces headline below — the brew-shift layers are CSS
 * gradients with no `background-image: url(...)`, so per the Largest Contentful Paint spec they are
 * never LCP candidates at all; there is no real product photo yet (no `product_images` row exists
 * pre-migration — see PLACEHOLDERS.md), so there is no `priority` packshot image to race the
 * headline for LCP either. This is verified against a real Lighthouse trace, not just asserted from
 * markup order — see the Phase 2 self-report.
 */
export function LemonShiftHero() {
  const copy = HOME_COPY.hero;

  return (
    <section
      data-hero="true"
      className="relative overflow-x-clip bg-bg"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:min-h-[100svh] lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brew-2">
            {copy.eyebrow}
          </p>
          <h1
            id="hero-heading"
            className="font-display font-semibold text-ink"
            style={{
              fontSize: "clamp(2.75rem, 6vw, 5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {copy.headline}
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-ink-2">{copy.sub}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button asChild variant="gradient" size="lg">
              <Link href={copy.ctaPrimaryHref}>{copy.ctaPrimaryLabel}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={copy.ctaSecondaryHref}>{copy.ctaSecondaryLabel}</Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm pb-10 lg:mx-0 lg:max-w-md">
          {/* Server-rendered static brew layer — the complete, correct visual with JS disabled or
              before hydration. Rest state is "blue" (brew-1/brew-2), matching the brand at rest;
              BrewShiftLayer takes over from this exact colour pair once it mounts. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-[18%] rounded-[38%_62%_63%_37%/41%_44%_56%_59%] opacity-70 blur-2xl"
            style={{ backgroundImage: "radial-gradient(circle at 32% 28%, var(--color-brew-1), var(--color-brew-2) 72%)" }}
          />
          {/* Static citrus rim — invisible at rest, matching BrewShiftLayer's rim before any scroll
              or drag has moved it forward. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg" style={{ opacity: 0 }}>
            <div className="absolute -inset-1 rounded-lg shadow-[0_0_0_3px_var(--color-citrus)]" />
          </div>

          <div className="relative z-10 rounded-lg bg-surface p-5 shadow-lift sm:p-7">
            <Placeholder slot="hero-blue-tea-packshot" />
          </div>

          <BrewShiftLayer />
        </div>
      </div>
    </section>
  );
}

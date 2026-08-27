import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { HOME_COPY } from "@/content/home";
import type { ProductCardData } from "@/types/catalog";

export interface BlueTeaBandProps {
  products: ProductCardData[];
}

/**
 * The Blue Tea full-bleed editorial band — CLAUDE.md §5.4's "the ONLY full-bleed band on the page."
 * No background of its own — it's rendered inside a shared `ScrollColorBand` wrapping both this
 * and `RedTeaSection` together (app/page.tsx), so the blue → pink → red colour shift (client
 * request reviving the "Lemon Shift" idea for this section instead of the removed hero) is one
 * continuous gradient canvas across both sections, not two separately-tracked ones stitched at
 * their shared edge — two independent instances produced a visible seam.
 *
 * Products render in `ProductCarousel` (client request), not a fixed grid — there are only 2 real
 * Blue Tea products today, but the carousel already scrolls/paginates correctly for however many
 * exist later, so this section doesn't need touching again as the catalogue grows.
 */
export function BlueTeaBand({ products }: BlueTeaBandProps) {
  const copy = HOME_COPY.blueTeaBand;

  return (
    <section aria-labelledby="blue-tea-heading" className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:py-24">
      <div className="flex min-w-0 flex-col gap-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">{copy.eyebrow}</p>
        <h2
          id="blue-tea-heading"
          className="font-display font-semibold text-white"
          style={{ fontSize: "clamp(1.75rem, 3vw, 2.75rem)", letterSpacing: "-0.015em", lineHeight: 1.1 }}
        >
          {copy.heading}
        </h2>
        <p className="max-w-lg text-base leading-relaxed text-white/90">{copy.bodyPrimary}</p>
        <p className="max-w-lg text-base leading-relaxed text-white/90">{copy.bodySecondary}</p>
        <div className="mt-2">
          <Button asChild variant="solid-ink" size="lg" className="bg-surface text-ink hover:bg-surface/90 hover:opacity-100">
            <Link href={copy.ctaHref}>{copy.ctaLabel}</Link>
          </Button>
        </div>
      </div>

      <div className="min-w-0">
        <ProductCarousel products={products} label="Blue Tea products" />
      </div>
    </section>
  );
}

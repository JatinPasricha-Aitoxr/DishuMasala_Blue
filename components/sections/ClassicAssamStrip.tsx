import { ProductCarousel } from "@/components/product/ProductCarousel";
import { HOME_COPY } from "@/content/home";
import type { ProductCardData } from "@/types/catalog";

export interface ClassicAssamStripProps {
  products: ProductCardData[];
}

/**
 * Classic & Assam — deliberately lower visual weight than every section above it (PRD §5.1 / Phase
 * 2 build note): a smaller heading with no eyebrow, a quiet `surface-2` band, and tighter vertical
 * padding. Cards are ProductCarousel's standard size (client request: exactly the same card
 * dimensions across every homepage section, no per-section override) — the "lower weight" here
 * comes entirely from the surrounding chrome, not a smaller card. Still real DB data — no name,
 * price or image is hardcoded here.
 */
export function ClassicAssamStrip({ products }: ClassicAssamStripProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="classic-assam-heading" className="bg-surface-2 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 id="classic-assam-heading" className="font-display text-lg font-semibold text-ink-2">
          {HOME_COPY.classicAssam.heading}
        </h2>
        {HOME_COPY.classicAssam.body.map((paragraph, i) => (
          <p key={i} className="mt-1 text-sm text-ink-2">
            {paragraph}
          </p>
        ))}

        <div className="mt-6">
          <ProductCarousel products={products} label="Classic & Assam products" />
        </div>
      </div>
    </section>
  );
}

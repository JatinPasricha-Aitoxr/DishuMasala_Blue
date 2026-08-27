import { ProductCarousel } from "@/components/product/ProductCarousel";
import { HOME_COPY } from "@/content/home";
import type { ProductCardData } from "@/types/catalog";

export interface ClassicAssamStripProps {
  products: ProductCardData[];
}

/**
 * Classic & Assam — deliberately lower visual weight than every section above it (PRD §5.1 / Phase
 * 2 build note): a smaller heading with no eyebrow, a quiet `surface-2` band instead of white, a
 * narrower-card carousel instead of a full grid, and tighter vertical padding. Still real DB data —
 * no name, price or image is hardcoded here.
 */
export function ClassicAssamStrip({ products }: ClassicAssamStripProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="classic-assam-heading" className="bg-surface-2 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 id="classic-assam-heading" className="font-display text-lg font-semibold text-ink-2">
          {HOME_COPY.classicAssam.heading}
        </h2>
        <p className="mt-1 text-sm text-ink-2">{HOME_COPY.classicAssam.body}</p>

        <div className="mt-6">
          <ProductCarousel products={products} label="Classic & Assam products" cardWidthClassName="w-36 sm:w-48" />
        </div>
      </div>
    </section>
  );
}

import { ProductCarousel } from "@/components/product/ProductCarousel";
import { SectionHeading } from "./SectionHeading";
import { HOME_COPY } from "@/content/home";
import type { ProductCardData } from "@/types/catalog";

export interface SpicesGridProps {
  products: ProductCardData[];
}

/** Spices — white cards, each carrying its own single-origin family accent chip (resolved in
 * ProductCard via lib/family-accent.ts from the product's own tags). No gradient anywhere here. */
export function SpicesGrid({ products }: SpicesGridProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="spices-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <SectionHeading
        id="spices-heading"
        eyebrow={HOME_COPY.spices.eyebrow}
        heading={HOME_COPY.spices.heading}
        body={HOME_COPY.spices.body}
        accentClassName="text-ink-2"
      />
      <div className="mt-10">
        <ProductCarousel products={products} label="Spices" />
      </div>
    </section>
  );
}

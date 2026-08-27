import { ProductCard } from "@/components/product/ProductCard";
import { Placeholder } from "@/components/media/Placeholder";
import { SectionHeading } from "./SectionHeading";
import { ScrollColorBand } from "./ScrollColorBand";
import { toProductCardProps } from "@/lib/product-card";
import { HOME_COPY } from "@/content/home";
import type { ProductCardData } from "@/types/catalog";

export interface RedTeaSectionProps {
  products: ProductCardData[];
}

/** Red Tea — CLAUDE.md §7.2's second priority slot. Background scroll-shifts from pink/magenta to
 * hibiscus red (`ScrollColorBand`, client request) — `fromVar` here matches `BlueTeaBand`'s
 * `toVar` exactly, so the colour picks up where Blue Tea's band left off rather than jump-cutting.
 * White text throughout (`SectionHeading`'s `tone="light"`) now that the background is a
 * saturated colour, not ivory. */
export function RedTeaSection({ products }: RedTeaSectionProps) {
  const copy = HOME_COPY.redTea;

  return (
    <ScrollColorBand fromVar="--color-brew-5" toVar="--color-hibiscus" className="w-full">
      <section aria-labelledby="red-tea-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <Placeholder slot="red-tea-lifestyle" className="rounded-lg" />
          <div className="flex flex-col gap-6">
            <SectionHeading id="red-tea-heading" eyebrow={copy.eyebrow} heading={copy.heading} body={copy.body} tone="light" />
            {products.length > 0 && (
              <ul className="grid grid-cols-2 gap-4 sm:max-w-md">
                {products.map((p) => (
                  <li key={p.slug}>
                    <ProductCard {...toProductCardProps(p)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </ScrollColorBand>
  );
}

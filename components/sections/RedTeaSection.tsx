import { ProductCard } from "@/components/product/ProductCard";
import { Placeholder } from "@/components/media/Placeholder";
import { SectionHeading } from "./SectionHeading";
import { toProductCardProps } from "@/lib/product-card";
import { HOME_COPY } from "@/content/home";
import type { ProductCardData } from "@/types/catalog";

export interface RedTeaSectionProps {
  products: ProductCardData[];
}

/** Red Tea — CLAUDE.md §7.2's second priority slot. Ivory ground with the hibiscus accent carried
 * only in text colour and a solid 3px divider rule, never a gradient background — Blue Tea's band
 * is the page's one full-bleed gradient surface (§5.4). */
export function RedTeaSection({ products }: RedTeaSectionProps) {
  const copy = HOME_COPY.redTea;

  return (
    <section aria-labelledby="red-tea-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <div aria-hidden="true" className="mb-8 h-[3px] w-16 rounded-full bg-hibiscus" />
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <Placeholder slot="red-tea-lifestyle" className="rounded-lg" />
        <div className="flex flex-col gap-6">
          <SectionHeading
            id="red-tea-heading"
            eyebrow={copy.eyebrow}
            heading={copy.heading}
            body={copy.body}
            accentClassName="text-hibiscus"
          />
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
  );
}

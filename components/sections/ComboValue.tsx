import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "./SectionHeading";
import { toProductCardProps } from "@/lib/product-card";
import { computeComboSavingPaise } from "@/lib/combo-savings";
import { formatINR } from "@/lib/money";
import { HOME_COPY } from "@/content/home";
import type { ProductCardData } from "@/types/catalog";

export interface ComboValueProps {
  combos: ProductCardData[];
  /** Every published spices-collection product with its variants — the raw ingredient list this
   * section matches combo names against to compute a real saving (lib/combo-savings.ts). */
  spices: ProductCardData[];
}

export function ComboValue({ combos, spices }: ComboValueProps) {
  if (combos.length === 0) return null;

  return (
    <section aria-labelledby="combos-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <SectionHeading
        id="combos-heading"
        eyebrow={HOME_COPY.combos.eyebrow}
        heading={HOME_COPY.combos.heading}
        body={HOME_COPY.combos.body}
        accentClassName="text-ink-2"
      />
      <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {combos.map((combo) => {
          const savingPaise = computeComboSavingPaise(combo, spices);
          return (
            <li key={combo.slug} className="relative">
              {savingPaise != null && (
                <span className="absolute left-2.5 top-2.5 z-20 rounded-sm bg-ink px-2 py-1 text-xs font-semibold tabular-nums text-surface shadow-card">
                  Save {formatINR(savingPaise)} vs. separately
                </span>
              )}
              <ProductCard {...toProductCardProps(combo)} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

"use client";

import { Placeholder } from "@/components/media/Placeholder";
import { PriceBlock } from "@/components/ui/PriceBlock";
import { Button } from "@/components/ui/Button";
import { paise } from "@/lib/money";
import { useCartStore } from "@/lib/store/cart";
import type { ProductCardData } from "@/types/catalog";

/**
 * Upsells "from higher-priority collections than what's currently in the cart" (PROMPTS.md Phase
 * 5 item 2, reusing CLAUDE.md §7.2's priority rule): `candidates` are the site's top products in
 * priority order (server-fetched, see CartUpsells.tsx); this client component filters them against
 * the live cart contents, since only the browser knows what's actually in the cart.
 */
export function CartUpsellsList({ candidates }: { candidates: ProductCardData[] }) {
  const lines = useCartStore((s) => s.lines);
  const addItem = useCartStore((s) => s.addItem);

  const cartProductIds = new Set(lines.map((l) => l.productId));
  const minCartPriority = lines.length > 0 ? Math.min(...lines.map((l) => l.priority)) : Infinity;

  const eligible = candidates
    .filter((p) => p.priority < minCartPriority)
    .filter((p) => !cartProductIds.has(p.id))
    .slice(0, 4);

  if (eligible.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-ink-2">You might also like</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {eligible.map((product) => {
          const variant = product.variants[0];
          if (!variant) return null;
          return (
            <div key={product.id} className="flex flex-col gap-2 rounded-md border border-line bg-surface p-3">
              <Placeholder slot="product-packshot-generic" className="rounded-sm" />
              <p className="text-sm font-semibold text-ink">{product.name}</p>
              <PriceBlock mrpPaise={paise(variant.mrpPaise)} pricePaise={paise(variant.pricePaise)} showTaxNote={false} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!variant.inStock}
                onClick={() =>
                  void addItem({
                    variantId: variant.id,
                    productId: product.id,
                    priority: product.priority,
                    qty: 1,
                    productName: product.name,
                    optionValue: variant.optionValue,
                    sku: variant.sku,
                    mrpPaise: variant.mrpPaise,
                    unitPricePaise: variant.pricePaise,
                    imageR2Key: null,
                  })
                }
              >
                Add to cart
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

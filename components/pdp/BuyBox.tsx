"use client";

import { useId, useMemo, useState } from "react";
import { PriceBlock } from "@/components/ui/PriceBlock";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Button } from "@/components/ui/Button";
import { useWishlistToggle } from "@/lib/hooks/useWishlistToggle";
import { cn } from "@/lib/cn";
import type { Variant } from "@/types/catalog";

export interface AddToCartPayload {
  variantId: number;
  sku: string;
  qty: number;
  unitPricePaise: number;
}

export interface BuyBoxProps {
  productId: number;
  productName: string;
  optionLabel: string;
  variants: Variant[];
  reviewCount: number;
  reviewAverage: number;
  /** Fires on every payload change (variant/qty) — Phase 5's cart store is the eventual real
   * consumer; for now this is how a caller (or a test) observes the live payload. */
  onPayloadChange?: (payload: AddToCartPayload) => void;
  /** Fires only on an explicit "Add to cart" click. No persistence layer exists yet (Phase 5
   * builds lib/store/cart.ts) — the click is real and the payload is correct, it just has nowhere
   * durable to go yet. */
  onAddToCart?: (payload: AddToCartPayload) => void;
}

/** Boolean-vs-count stock line (CLAUDE.md §7.6): a null `stockQty` — true for every seeded variant
 * today, since the source catalogue only ever recorded in/out of stock — never renders a number. */
function StockLine({ variant }: { variant: Variant }) {
  if (!variant.inStock) {
    return <p className="text-sm font-medium text-crit">Out of stock</p>;
  }
  if (variant.stockQty != null && variant.stockQty < 10) {
    return <p className="text-sm font-medium text-warn">Only {variant.stockQty} left</p>;
  }
  return <p className="text-sm font-medium text-ok">In stock</p>;
}

export function BuyBox({
  productId,
  productName,
  optionLabel,
  variants,
  reviewCount,
  reviewAverage,
  onPayloadChange,
  onAddToCart,
}: BuyBoxProps) {
  const [variantId, setVariantId] = useState(variants[0]?.id);
  const [qty, setQty] = useState(1);
  const { wishlisted, toggle: toggleWishlist } = useWishlistToggle(productId);
  const [justAdded, setJustAdded] = useState(false);
  const groupName = useId();

  const selected = useMemo(
    () => variants.find((v) => v.id === variantId) ?? variants[0],
    [variants, variantId],
  );

  const payload: AddToCartPayload | null = selected
    ? { variantId: selected.id, sku: selected.sku, qty, unitPricePaise: selected.pricePaise }
    : null;

  const selectVariant = (id: number) => {
    setVariantId(id);
    setJustAdded(false);
    const v = variants.find((x) => x.id === id);
    if (v) onPayloadChange?.({ variantId: v.id, sku: v.sku, qty, unitPricePaise: v.pricePaise });
  };

  const changeQty = (n: number) => {
    setQty(n);
    if (selected) onPayloadChange?.({ variantId: selected.id, sku: selected.sku, qty: n, unitPricePaise: selected.pricePaise });
  };

  if (!selected) return null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{productName}</h1>
        <a
          href="#reviews"
          className="mt-1.5 inline-block text-sm text-ink-2 underline underline-offset-4 hover:text-ink"
        >
          {reviewCount > 0
            ? `${reviewAverage.toFixed(1)} ★ (${reviewCount} review${reviewCount === 1 ? "" : "s"})`
            : "No reviews yet"}
        </a>
      </div>

      <PriceBlock mrpPaise={selected.mrpPaise} pricePaise={selected.pricePaise} size="lg" />

      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">{optionLabel}</legend>
          <div role="radiogroup" aria-label={optionLabel} className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const checked = v.id === selected.id;
              return (
                <label
                  key={v.id}
                  className={cn(
                    "relative flex cursor-pointer items-center rounded-sm border px-3 py-1.5 text-sm font-medium transition-colors duration-[180ms]",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brew-2 has-[:focus-visible]:ring-offset-2",
                    !v.inStock && "opacity-50",
                    checked ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink-2 hover:border-ink-3",
                  )}
                >
                  <input
                    type="radio"
                    name={groupName}
                    value={v.optionValue}
                    checked={checked}
                    onChange={() => selectVariant(v.id)}
                    className="sr-only"
                  />
                  {v.optionValue}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <p className="-mt-1 text-xs text-ink-2" data-testid="buybox-sku">
        SKU: {selected.sku}
      </p>

      <StockLine variant={selected} />

      <div className="flex items-center gap-3">
        <QuantityStepper value={qty} onChange={changeQty} aria-label="Quantity" />
        <Button
          variant="gradient"
          size="lg"
          className="flex-1"
          disabled={!selected.inStock}
          onClick={() => {
            if (!payload) return;
            onAddToCart?.(payload);
            setJustAdded(true);
          }}
        >
          {justAdded ? "Added" : "Add to cart"}
        </Button>
        <button
          type="button"
          onClick={toggleWishlist}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
          className="flex size-11 shrink-0 items-center justify-center rounded-md border border-line text-ink hover:bg-surface-2"
        >
          <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
            <path
              d="M10 17s-6.5-4.06-8.2-7.86C.6 6.6 2 3.5 5.2 3.1c1.9-.24 3.5.9 4.8 2.6 1.3-1.7 2.9-2.84 4.8-2.6 3.2.4 4.6 3.5 3.4 6.04C16.5 12.94 10 17 10 17Z"
              fill={wishlisted ? "var(--color-hibiscus)" : "none"}
              stroke={wishlisted ? "var(--color-hibiscus)" : "currentColor"}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <p className="text-xs text-ink-2">Inclusive of all taxes (GST). Cash on Delivery available.</p>

      {/* Not visually rendered — the live add-to-cart payload as JSON, so an automated keyboard/
       * interaction test can verify variant switching updates it with no navigation, per Phase 4's
       * acceptance criteria, without needing a real cart store (Phase 5) to inspect. */}
      <span className="sr-only" data-testid="add-to-cart-payload" aria-hidden="true">
        {JSON.stringify(payload)}
      </span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { BuyBox, type AddToCartPayload } from "@/components/pdp/BuyBox";
import { StickyAddToCart } from "@/components/pdp/StickyAddToCart";
import type { Variant } from "@/types/catalog";

const BUY_BOX_ID = "pdp-buy-box";

export interface PdpInteractiveProps {
  productName: string;
  optionLabel: string;
  variants: Variant[];
  reviewCount: number;
  reviewAverage: number;
}

/**
 * Owns the one piece of state BuyBox and StickyAddToCart both need to agree on — the currently
 * selected variant/quantity — so switching a variant in the main BuyBox is reflected in the sticky
 * mobile bar's price too. No cart store exists yet (Phase 5's lib/store/cart.ts); "add to cart"
 * here is a real, correct payload with nowhere durable to persist to yet, exactly as scoped for
 * this phase.
 */
export function PdpInteractive({ productName, optionLabel, variants, reviewCount, reviewAverage }: PdpInteractiveProps) {
  const [payload, setPayload] = useState<AddToCartPayload | null>(() => {
    const first = variants[0];
    return first ? { variantId: first.id, sku: first.sku, qty: 1, unitPricePaise: first.pricePaise } : null;
  });

  const selectedVariant = variants.find((v) => v.id === payload?.variantId) ?? variants[0];

  const addToCart = (p: AddToCartPayload) => {
    // Phase 5 wires this to lib/store/cart.ts. For now the payload is real and inspectable
    // (BuyBox also exposes it via a data-testid element) rather than persisted anywhere.
    console.log("[pdp] add to cart", p);
  };

  return (
    <>
      <div id={BUY_BOX_ID}>
        <BuyBox
          productName={productName}
          optionLabel={optionLabel}
          variants={variants}
          reviewCount={reviewCount}
          reviewAverage={reviewAverage}
          onPayloadChange={setPayload}
          onAddToCart={addToCart}
        />
      </div>

      {selectedVariant && payload && (
        <StickyAddToCart
          buyBoxId={BUY_BOX_ID}
          productName={productName}
          mrpPaise={selectedVariant.mrpPaise}
          pricePaise={selectedVariant.pricePaise}
          disabled={!selectedVariant.inStock}
          onAddToCart={() => addToCart(payload)}
        />
      )}
    </>
  );
}

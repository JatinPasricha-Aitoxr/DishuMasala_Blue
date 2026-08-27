"use client";

import { useState } from "react";
import { BuyBox, type AddToCartPayload } from "@/components/pdp/BuyBox";
import { StickyAddToCart } from "@/components/pdp/StickyAddToCart";
import { useCartStore } from "@/lib/store/cart";
import type { Variant } from "@/types/catalog";

const BUY_BOX_ID = "pdp-buy-box";

export interface PdpInteractiveProps {
  productId: number;
  productName: string;
  optionLabel: string;
  variants: Variant[];
  priority: number;
  primaryImageR2Key: string | null;
  reviewCount: number;
  reviewAverage: number;
}

/**
 * Owns the one piece of state BuyBox and StickyAddToCart both need to agree on — the currently
 * selected variant/quantity — so switching a variant in the main BuyBox is reflected in the sticky
 * mobile bar's price too. Phase 5 wires "add to cart" for real, into lib/store/cart.ts (the first
 * phase with a persistent cart store) — the BuyBox payload that used to just be logged now pushes
 * a real line into the cart, which itself immediately revalidates against the server.
 */
export function PdpInteractive({
  productId,
  productName,
  optionLabel,
  variants,
  priority,
  primaryImageR2Key,
  reviewCount,
  reviewAverage,
}: PdpInteractiveProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [payload, setPayload] = useState<AddToCartPayload | null>(() => {
    const first = variants[0];
    return first ? { variantId: first.id, sku: first.sku, qty: 1, unitPricePaise: first.pricePaise } : null;
  });

  const selectedVariant = variants.find((v) => v.id === payload?.variantId) ?? variants[0];

  const addToCart = (p: AddToCartPayload) => {
    const variant = variants.find((v) => v.id === p.variantId);
    if (!variant) return;
    void addItem({
      variantId: variant.id,
      productId,
      priority,
      qty: p.qty,
      productName,
      optionValue: variant.optionValue,
      sku: variant.sku,
      mrpPaise: variant.mrpPaise,
      unitPricePaise: variant.pricePaise,
      imageR2Key: primaryImageR2Key,
    });
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

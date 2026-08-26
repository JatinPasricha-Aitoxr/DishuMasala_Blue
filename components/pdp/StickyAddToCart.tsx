"use client";

import { useEffect, useRef, useState } from "react";
import { PriceBlock } from "@/components/ui/PriceBlock";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Paise } from "@/lib/money";

export interface StickyAddToCartProps {
  /** The id of BuyBox's own root element — observed via IntersectionObserver, never a scroll-Y
   * pixel threshold, so this works regardless of how much content sits above it. */
  buyBoxId: string;
  productName: string;
  mrpPaise: Paise;
  pricePaise: Paise;
  disabled: boolean;
  onAddToCart: () => void;
}

/** Mobile-only (hidden at `sm:` and up), appears once the real BuyBox has scrolled out of the
 * viewport. Respects the notch/home-indicator safe area on iOS via `env(safe-area-inset-bottom)`. */
export function StickyAddToCart({ buyBoxId, productName, mrpPaise, pricePaise, disabled, onAddToCart }: StickyAddToCartProps) {
  const [visible, setVisible] = useState(false);
  const observed = useRef(false);

  useEffect(() => {
    const target = document.getElementById(buyBoxId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        observed.current = true;
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [buyBoxId]);

  return (
    <div
      role="region"
      aria-label={`Quick add to cart for ${productName}`}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-surface px-4 py-3 shadow-lift sm:hidden",
        "transition-transform duration-[200ms] ease-[cubic-bezier(.2,.6,.2,1)]",
        visible ? "translate-y-0" : "translate-y-full pointer-events-none",
      )}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      aria-hidden={!visible}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{productName}</p>
        <PriceBlock mrpPaise={mrpPaise} pricePaise={pricePaise} showTaxNote={false} />
      </div>
      <Button variant="gradient" onClick={onAddToCart} disabled={disabled} tabIndex={visible ? 0 : -1}>
        Add to cart
      </Button>
    </div>
  );
}

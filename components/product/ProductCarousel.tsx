"use client";

import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { toProductCardProps } from "@/lib/product-card";
import type { ProductCardData } from "@/types/catalog";

export interface ProductCarouselProps {
  products: ProductCardData[];
  /** aria-label for the scrollable region — should describe what's in it (e.g. "Blue Tea products"). */
  label: string;
  /** Tailwind width classes for each card. Defaults to a size that shows ~2 cards per row on
   *  mobile and scales up on larger screens. */
  cardWidthClassName?: string;
}

/**
 * A horizontally-scrolling product carousel with scroll-snap and prev/next controls. Built for
 * CLAUDE.md §7.2's priority-1 Blue Tea band (currently 2 real products — this renders correctly at
 * any count, from 1 product with no controls up through a full shelf, so it doesn't need to change
 * again as the catalogue grows). Reusable anywhere else a themed product shelf needs the same
 * "scrolls, doesn't grid-wrap" treatment.
 *
 * Real scroll, not a synthetic transform-based slider — native momentum scrolling, works with
 * trackpad/touch/keyboard out of the box; the prev/next buttons are a convenience on top, not the
 * only way to move. Buttons disable themselves at each end rather than wrapping around, and hide
 * entirely once every product already fits in view (checked on mount and on resize) — no infinite
 * loop, no dead "prev"/"next" clicks on a shelf that doesn't need them (CLAUDE.md §9's "no infinite
 * scroll" discipline for the shop grid applies in spirit here too: don't fake scale that isn't
 * there yet).
 */
export function ProductCarousel({ products, label, cardWidthClassName = "w-[72%] sm:w-64" }: ProductCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [overflows, setOverflows] = useState(false);

  const updateScrollState = () => {
    const el = trackRef.current;
    if (!el) return;
    setOverflows(el.scrollWidth > el.clientWidth + 1);
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [products.length]);

  if (products.length === 0) return null;

  function scrollByCard(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-item]");
    const step = (card?.offsetWidth ?? el.clientWidth * 0.72) + 16; // card width + gap
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <li key={p.slug} data-carousel-item className={`shrink-0 snap-start ${cardWidthClassName}`}>
            <ProductCard {...toProductCardProps(p)} />
          </li>
        ))}
      </ul>

      {overflows && (
        <>
          <button
            type="button"
            aria-label="Previous product"
            disabled={!canScrollPrev}
            onClick={() => scrollByCard(-1)}
            className="absolute left-1 top-[38%] flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-card disabled:opacity-0"
          >
            <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
              <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next product"
            disabled={!canScrollNext}
            onClick={() => scrollByCard(1)}
            className="absolute right-1 top-[38%] flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-card disabled:opacity-0"
          >
            <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
              <path d="M7.5 15 12.5 10l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

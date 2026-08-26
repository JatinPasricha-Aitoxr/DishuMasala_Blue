"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Placeholder } from "@/components/media/Placeholder";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { cn } from "@/lib/cn";

export interface GallerySlide {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface GalleryProps {
  productName: string;
  /** Real `product_images` rows, already resolved to public URLs, position-ordered, primary
   * first — empty until scripts/migrate-images.ts has run (CLAUDE.md §8). */
  slides: GallerySlide[];
  className?: string;
}

/**
 * No real product photography exists yet anywhere in the catalogue (migrate-images.ts has never
 * run — every `slides` array passed in today is empty), so this always falls back to exactly one
 * placeholder slide. The component is still built as the real, multi-image gallery it will become
 * the moment real images land: thumbnail rail, click-to-zoom, swipe, and full keyboard support all
 * operate over `slides.length` generically rather than being hand-fitted to "just one image".
 */
export function Gallery({ productName, slides, className }: GalleryProps) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const hasReal = slides.length > 0;
  const count = hasReal ? slides.length : 1;
  const current = hasReal ? slides[index] : null;

  const goTo = (i: number) => setIndex(((i % count) + count) % count);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setZoomOpen(true);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? index + 1 : index - 1);
    touchStartX.current = null;
  };

  const activeAlt = current?.alt ?? `${productName} — product photo (placeholder; real photography coming soon)`;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        ref={mainRef}
        role="group"
        aria-roledescription="image gallery"
        aria-label={`${productName} photos`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => setZoomOpen(true)}
        className="relative w-full cursor-zoom-in overflow-hidden rounded-lg bg-surface-2 outline-none focus-visible:ring-2 focus-visible:ring-brew-2 focus-visible:ring-offset-2"
        style={{ aspectRatio: "1 / 1" }}
      >
        {current ? (
          <Image
            src={current.url}
            alt={current.alt}
            width={current.width}
            height={current.height}
            priority={index === 0}
            className="h-full w-full object-cover"
          />
        ) : (
          <Placeholder slot="product-packshot-generic" className="h-full w-full" />
        )}
        <span className="sr-only">{activeAlt}. Press Enter to zoom, arrow keys to browse.</span>
      </div>

      {count > 1 && (
        <div role="tablist" aria-label="Product photos" className="flex gap-2">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`View photo ${i + 1} of ${count}`}
              onClick={() => goTo(i)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors duration-[180ms]",
                i === index ? "border-brew-2" : "border-transparent hover:border-line",
              )}
              style={{ aspectRatio: "1 / 1" }}
            >
              {slides[i] ? (
                <Image src={slides[i].url} alt="" width={64} height={64} className="h-full w-full object-cover" />
              ) : (
                <Placeholder slot="product-packshot-generic" className="h-full w-full" />
              )}
            </button>
          ))}
        </div>
      )}

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-2xl bg-surface p-2">
          <VisuallyHidden>
            <DialogTitle>{activeAlt}</DialogTitle>
          </VisuallyHidden>
          <div className="relative w-full overflow-hidden rounded-md" style={{ aspectRatio: "1 / 1" }}>
            {current ? (
              <Image src={current.url} alt={current.alt} fill className="object-contain" />
            ) : (
              <Placeholder slot="product-packshot-generic" className="h-full w-full" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

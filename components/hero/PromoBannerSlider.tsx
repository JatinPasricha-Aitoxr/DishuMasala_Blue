"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HomepageBanner } from "@/lib/db/queries/settings";

const AUTOPLAY_MS = 6000;

/**
 * The client-supplied homepage promotional slider (scripts/migrate-homepage-banners.ts). This is
 * a deliberate, logged exception to this project's usual design/copy discipline — see that
 * script's header comment and CLAUDE.md §8 for the full note: these banner images carry the
 * client's own marketing text baked into the pixels (including phrasing this project would never
 * write itself), used as-is because the client explicitly chose that after Claude flagged the
 * conflict directly.
 *
 * Sits above LemonShiftHero (app/page.tsx), not in place of it — the brand's signature animated
 * hero is still the first thing under this seasonal/promotional strip.
 */
export function PromoBannerSlider({ banners }: { banners: HomepageBanner[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion || banners.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [playing, reducedMotion, banners.length]);

  if (banners.length === 0) return null;

  const current = banners[index];
  const aspectRatio = `${current.width} / ${current.height}`;

  function goTo(i: number) {
    setIndex(((i % banners.length) + banners.length) % banners.length);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    }
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promotions"
      className="relative w-full overflow-hidden bg-surface-2"
      ref={containerRef}
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
      onKeyDown={handleKeyDown}
    >
      <div className="relative w-full" style={{ aspectRatio, maxHeight: "70vh" }}>
        {banners.map((banner, i) => (
          <Link
            key={banner.slot}
            href={banner.href}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            className="absolute inset-0 transition-opacity duration-500 ease-out"
            style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? "auto" : "none" }}
          >
            <Image
              src={banner.url}
              alt={banner.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </Link>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
          <div className="flex gap-2 rounded-full bg-ink/40 px-3 py-1.5 backdrop-blur-sm">
            {banners.map((banner, i) => (
              <button
                key={banner.slot}
                type="button"
                aria-label={`Go to slide ${i + 1} of ${banners.length}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`size-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            onClick={() => setPlaying((p) => !p)}
            className="flex size-7 items-center justify-center rounded-full bg-ink/40 text-white backdrop-blur-sm"
          >
            {playing ? (
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-3" aria-hidden="true">
                <rect x="3" y="2" width="3" height="12" rx="0.5" />
                <rect x="10" y="2" width="3" height="12" rx="0.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-3" aria-hidden="true">
                <path d="M4 2.5v11l10-5.5-10-5.5Z" />
              </svg>
            )}
          </button>
        </div>
      )}

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => goTo(index - 1)}
        className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/40 text-white backdrop-blur-sm hover:bg-ink/60"
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
          <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => goTo(index + 1)}
        className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/40 text-white backdrop-blur-sm hover:bg-ink/60"
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
          <path d="M7.5 15 12.5 10l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}

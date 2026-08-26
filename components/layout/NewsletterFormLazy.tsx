"use client";

import dynamic from "next/dynamic";

// NewsletterForm pulls in react-hook-form + the Zod resolver purely for one below-the-fold email
// field (footer + the homepage newsletter section) — real weight that has no business in every
// page's first-load JS (CLAUDE.md §11 / PROMPTS.md Phase 2: homepage first-load JS ≤ 180KB gzip).
// `ssr: false` needs a Client Component boundary, hence this one-line wrapper (same pattern as
// components/hero/BrewShiftLayerLazy.tsx).
//
// The `loading` fallback below is sized to match the real form's rendered height exactly (a 20px
// label line + an 8px gap + a 44px input/button row, the same h-11 every Input and Button already
// use) so mounting the real form causes zero layout shift, not a blank-then-pop-in.
function NewsletterFormSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-[20px] w-40 rounded-sm bg-surface-2" />
      <div className="flex gap-2">
        <div className="h-11 flex-1 rounded-md border border-line bg-surface" />
        <div className="h-11 w-28 rounded-md bg-surface-2" />
      </div>
    </div>
  );
}

export const NewsletterFormLazy = dynamic(() => import("./NewsletterForm").then((m) => m.NewsletterForm), {
  ssr: false,
  loading: NewsletterFormSkeleton,
});

"use client";

import dynamic from "next/dynamic";

// `next/dynamic`'s `ssr: false` can only be called from within a Client Component (Next.js App
// Router) — this one-line wrapper is that boundary, so LemonShiftHero.tsx itself can stay a plain
// Server Component and just render <BrewShiftLayerLazy /> like any other import.
export const BrewShiftLayerLazy = dynamic(() => import("./BrewShiftLayer").then((m) => m.BrewShiftLayer), {
  ssr: false,
});

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrustStrip } from "@/components/layout/TrustStrip";
import { DesignSystemContent } from "./DesignSystemContent";

// Dev-only: gated on NODE_ENV so a production build's route tree still contains /design-system
// (Next.js won't tree-shake a page component away), but any request to it in production 404s via
// notFound() before rendering anything — chosen over a route-segment `generateStaticParams` empty
// return or middleware block because it's the least code for a single, self-contained page and
// keeps the "why" directly next to the guard instead of split across files. `robots: { index:
// false }` below is a second, independent layer in case a production build is ever misconfigured
// with NODE_ENV !== "production" — belt and suspenders, not a substitute for the notFound() guard.
//
// Phase 9 (next-sitemap) note: this route MUST be added to next-sitemap's `exclude` list when that
// config is written — there is no sitemap mechanism yet to wire it into today.
export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DesignSystemContent trustStrip={<TrustStrip />} />;
}

import { getCollectionsWithStats } from "@/lib/db/queries/collections";
import { getPublishedProductsByCollectionSlug } from "@/lib/db/queries/products";
import { getHomepageBanners, getRedTeaSectionBanner, getRedTeaLifestyleImage, getSpicesSectionBanner } from "@/lib/db/queries/settings";
import { PromoBannerSlider } from "@/components/hero/PromoBannerSlider";
import { TrustStrip } from "@/components/layout/TrustStrip";
import { BlueTeaBand } from "@/components/sections/BlueTeaBand";
import { RedTeaSection } from "@/components/sections/RedTeaSection";
import { ScrollColorBand } from "@/components/sections/ScrollColorBand";
import { SpicesBanner } from "@/components/sections/SpicesBanner";
import { ComboValue } from "@/components/sections/ComboValue";
import { SpicesGrid } from "@/components/sections/SpicesGrid";
import { ClassicAssamStrip } from "@/components/sections/ClassicAssamStrip";
import { RitualTeaser } from "@/components/sections/RitualTeaser";
import { ReviewsEmptyState } from "@/components/sections/ReviewsEmptyState";
import { NewsletterSection } from "@/components/sections/NewsletterSection";

/**
 * The homepage (Phase 2 / PROMPTS.md, replacing Phase 0's plain-text DB proof page). Section order
 * follows CLAUDE.md §7.2's priority rule ("Blue Tea first. Then Red Tea. Then everything else") for
 * the top two slots; below that it's a client-directed homepage template, not the raw `priority`
 * order — `/shop`'s default sort (Phase 3) uses the unmodified `priority` order everywhere else.
 * Two deliberate deviations from raw `priority` (2, then 3, then 4, then 5), both direct client
 * requests, not oversights:
 * - Classic & Assam (priority 3) now renders right after Red Tea (2026-08-28: "section after red
 *   tea section"), not last — this reverses PRD §5.1 item 7's original "last and quietest"
 *   placement for it.
 * - Spices (priority 5) still renders before Combo Packs (priority 4) (2026-08-28: "before the
 *   Combo Packs section we need a section for Masala/spices, then combo section").
 *
 * Every product/collection value below is read from Postgres via lib/db/queries/* — nothing in this
 * file or components/sections/* hardcodes a name, price or image URL.
 */
export default async function Home() {
  const [collections, blueTea, redTea, combos, spices, classicAssam, banners, redTeaBanner, redTeaLifestyle, spicesBanner] =
    await Promise.all([
      getCollectionsWithStats(),
      getPublishedProductsByCollectionSlug("blue-tea"),
      getPublishedProductsByCollectionSlug("red-tea"),
      getPublishedProductsByCollectionSlug("combos"),
      getPublishedProductsByCollectionSlug("spices"),
      getPublishedProductsByCollectionSlug("classic-teas"),
      getHomepageBanners(),
      getRedTeaSectionBanner(),
      getRedTeaLifestyleImage(),
      getSpicesSectionBanner(),
    ]);

  // The one part of CLAUDE.md §7.2 this file's fixed section order can't re-derive on its own is
  // "Blue Tea first, then Red Tea" — verify that invariant against the live DB priority values on
  // every render rather than silently trusting it forever (an admin edit in a later phase could
  // break it).
  const priorityOf = (slug: string) => collections.find((c) => c.slug === slug)?.priority;
  const blueTeaPriority = priorityOf("blue-tea");
  const redTeaPriority = priorityOf("red-tea");
  if (blueTeaPriority == null || redTeaPriority == null || !(blueTeaPriority < redTeaPriority)) {
    console.warn(
      "app/page.tsx: collections.priority no longer puts Blue Tea before Red Tea — the homepage's " +
        "fixed section order (CLAUDE.md §7.2) needs re-checking against the current DB values.",
    );
  }

  return (
    <>
      <PromoBannerSlider banners={banners} />
      <TrustStrip />
      <ScrollColorBand fromVar="--color-brew-2" viaVar="--color-brew-5" toVar="--color-hibiscus" className="w-full">
        <BlueTeaBand products={blueTea} />
        <RedTeaSection products={redTea} lifestyleImage={redTeaLifestyle} />
      </ScrollColorBand>
      <PromoBannerSlider banners={redTeaBanner} ariaLabel="Red Tea promotion" />
      <ClassicAssamStrip products={classicAssam} />
      <SpicesBanner banner={spicesBanner} />
      <SpicesGrid products={spices} />
      <ComboValue combos={combos} spices={spices} />
      <RitualTeaser />
      <ReviewsEmptyState />
      <NewsletterSection />
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { PromoBannerSlider } from "@/components/hero/PromoBannerSlider";
import { CollectionFaq } from "@/components/sections/CollectionFaq";
import { getAllCollectionSlugs, getCollectionBySlug } from "@/lib/db/queries/collections";
import { getPublishedProductsByCollectionSlug } from "@/lib/db/queries/products";
import { getCollectionPageBanner } from "@/lib/db/queries/settings";
import { GRADIENT_TILE_SLUGS } from "@/lib/nav";
import { resolveFamilyAccent, familyAccentVar } from "@/lib/family-accent";
import { formatINR, type Paise } from "@/lib/money";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

/** All 5 collection slugs, known at build time (CLAUDE.md §6's fixed catalogue shape) — statically
 * generates every `/collections/<slug>/` page rather than rendering them on demand. */
export async function generateStaticParams() {
  const slugs = await getAllCollectionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};

  return {
    // seo_title/seo_description are unpopulated in today's seed (data/catalog.json carries no SEO
    // copy) — fall back to the collection's own real title/tagline rather than rendering nothing.
    title: collection.seoTitle ?? `${collection.title} — Dishu Masala`,
    description:
      collection.seoDescription ??
      collection.tagline ??
      `Shop ${collection.title} at Dishu Masala — organic, GST-inclusive pricing, free shipping over ₹500.`,
    alternates: { canonical: `/collections/${collection.slug}/` },
  };
}

/** Blue Tea and Red Tea headers use the Lemon Shift/hibiscus gradient tile treatment (CLAUDE.md
 * §5.4: "Blue Tea and Red Tea collection tiles" is one of the explicitly allowed gradient
 * placements) — one gradient surface for the whole viewport, same cap the homepage bands respect.
 * The other three collections get an ivory header with their own family-accent rule instead. */
function CollectionHeader({
  title,
  tagline,
  slug,
  productCount,
  minPricePaise,
  maxPricePaise,
}: {
  title: string;
  tagline: string | null;
  slug: string;
  productCount: number;
  minPricePaise: Paise | null;
  maxPricePaise: Paise | null;
}) {
  const isGradient = GRADIENT_TILE_SLUGS.has(slug);
  const priceRange =
    minPricePaise != null && maxPricePaise != null
      ? minPricePaise === maxPricePaise
        ? formatINR(minPricePaise)
        : `${formatINR(minPricePaise)} – ${formatINR(maxPricePaise)}`
      : null;

  if (isGradient) {
    const gradient = slug === "blue-tea" ? "var(--gradient-brew-cool)" : "var(--gradient-hibiscus)";
    return (
      <header className="w-full" style={{ backgroundImage: gradient }}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">Collection</p>
          <h1
            className="mt-3 font-display font-semibold text-white"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", letterSpacing: "-0.015em", lineHeight: 1.1 }}
          >
            {title}
          </h1>
          {tagline && <p className="mt-3 max-w-xl text-base leading-relaxed text-white/90">{tagline}</p>}
          <p className="mt-5 text-sm text-white/80">
            {productCount} product{productCount === 1 ? "" : "s"}
            {priceRange ? ` · ${priceRange}` : ""}
          </p>
        </div>
      </header>
    );
  }

  const accent = familyAccentVar(resolveFamilyAccent(slug, []));
  return (
    <header className="w-full bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
        <div aria-hidden="true" className="mb-6 h-[3px] w-16 rounded-full" style={{ backgroundColor: accent }} />
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: accent }}>
          Collection
        </p>
        <h1
          className="mt-3 font-display font-semibold text-ink"
          style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", letterSpacing: "-0.015em", lineHeight: 1.1 }}
        >
          {title}
        </h1>
        {tagline && <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">{tagline}</p>}
        <p className="mt-5 text-sm text-ink-2">
          {productCount} product{productCount === 1 ? "" : "s"}
          {priceRange ? ` · ${priceRange}` : ""}
        </p>
      </div>
    </header>
  );
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const [products, pageBanner] = await Promise.all([
    getPublishedProductsByCollectionSlug(slug),
    getCollectionPageBanner(slug),
  ]);

  return (
    <div>
      {pageBanner.length > 0 && (
        <PromoBannerSlider banners={pageBanner} ariaLabel={`${collection.title} promotions`} fullBleed />
      )}
      <CollectionHeader
        title={collection.title}
        tagline={collection.tagline}
        slug={collection.slug}
        productCount={collection.productCount}
        minPricePaise={collection.minPricePaise}
        maxPricePaise={collection.maxPricePaise}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        {products.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface-2 px-6 py-16 text-center text-ink-2">
            No products are published in this collection yet.
          </p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>

      <CollectionFaq collectionSlug={collection.slug} collectionTitle={collection.title} />
    </div>
  );
}

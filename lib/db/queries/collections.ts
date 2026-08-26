import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { collections, products, variants } from "../schema";
import { paise } from "@/lib/money";
import type { CollectionSummary } from "@/types/catalog";

/**
 * All collections in priority order (CLAUDE.md §7.2: "Blue Tea first. Then Red Tea. Then
 * everything else... Lower sorts first, everywhere"), each annotated with its published product
 * count and sale-price range — a single round trip via one grouped query.
 */
export async function getCollectionsWithStats(): Promise<CollectionSummary[]> {
  const rows = await db
    .select({
      id: collections.id,
      slug: collections.slug,
      title: collections.title,
      tagline: collections.tagline,
      priority: collections.priority,
      accentToken: collections.accentToken,
      position: collections.position,
      seoTitle: collections.seoTitle,
      seoDescription: collections.seoDescription,
      productCount: sql<number>`count(distinct ${products.id})`,
      minPricePaise: sql<number | null>`min(${variants.pricePaise})`,
      maxPricePaise: sql<number | null>`max(${variants.pricePaise})`,
    })
    .from(collections)
    .leftJoin(
      products,
      and(eq(products.collectionId, collections.id), eq(products.status, "published")),
    )
    .leftJoin(variants, eq(variants.productId, products.id))
    .groupBy(collections.id)
    .orderBy(asc(collections.priority));

  return rows.map((r) => ({
    ...r,
    productCount: Number(r.productCount),
    minPricePaise: r.minPricePaise == null ? null : paise(Number(r.minPricePaise)),
    maxPricePaise: r.maxPricePaise == null ? null : paise(Number(r.maxPricePaise)),
  }));
}

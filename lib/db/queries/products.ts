import "server-only";

import { unstable_cache } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../index";
import { collections, products, variants } from "../schema";
import { paise } from "@/lib/money";
import type { ProductCardData } from "@/types/catalog";

/**
 * Published products in one collection, each with its full variant list (ordered by position) and
 * its parent collection's slug/title denormalised alongside it — one round trip, everything the
 * homepage sections (components/sections/*) and ProductCard need, so none of them import drizzle or
 * query lib/db directly (CLAUDE.md §3.2).
 *
 * Ordered by the product's own `priority`, then `id` as a stable, non-invented tiebreak — the seed
 * data gives every product in a collection the same priority (its collection's rank), so `id` (insert
 * order from data/catalog.json) is what actually determines display order within the collection.
 *
 * Cached per collection with `unstable_cache` on the `products` and `collection:<slug>` tags
 * (CLAUDE.md §3.4) — an admin mutation that changes this collection's products must call
 * `revalidateTag("collection:<slug>")` (and/or "products") for the storefront to pick it up.
 */
export async function getPublishedProductsByCollectionSlug(slug: string): Promise<ProductCardData[]> {
  return unstable_cache(() => fetchPublishedProductsByCollectionSlug(slug), ["products-by-collection", slug], {
    tags: ["products", `collection:${slug}`],
  })();
}

async function fetchPublishedProductsByCollectionSlug(slug: string): Promise<ProductCardData[]> {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      collectionId: products.collectionId,
      collectionSlug: collections.slug,
      collectionTitle: collections.title,
      shortDescription: products.shortDescription,
      description: products.description,
      ingredients: products.ingredients,
      brewGuide: products.brewGuide,
      tags: products.tags,
      optionLabel: products.optionLabel,
      priority: products.priority,
      status: products.status,
      seoTitle: products.seoTitle,
      seoDescription: products.seoDescription,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      variant: {
        id: variants.id,
        productId: variants.productId,
        sku: variants.sku,
        optionValue: variants.optionValue,
        mrpPaise: variants.mrpPaise,
        pricePaise: variants.pricePaise,
        weightGrams: variants.weightGrams,
        inStock: variants.inStock,
        stockQty: variants.stockQty,
        position: variants.position,
      },
    })
    .from(products)
    .innerJoin(collections, eq(products.collectionId, collections.id))
    .leftJoin(variants, eq(variants.productId, products.id))
    .where(and(eq(collections.slug, slug), eq(products.status, "published")))
    .orderBy(asc(products.priority), asc(products.id), asc(variants.position));

  const bySlug = new Map<string, ProductCardData>();

  for (const r of rows) {
    let product = bySlug.get(r.slug);
    if (!product) {
      product = {
        id: r.id,
        slug: r.slug,
        name: r.name,
        collectionId: r.collectionId,
        collectionSlug: r.collectionSlug,
        collectionTitle: r.collectionTitle,
        shortDescription: r.shortDescription,
        description: r.description,
        ingredients: r.ingredients,
        brewGuide: r.brewGuide,
        tags: r.tags,
        optionLabel: r.optionLabel,
        priority: r.priority,
        status: r.status,
        seoTitle: r.seoTitle,
        seoDescription: r.seoDescription,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        variants: [],
      };
      bySlug.set(r.slug, product);
    }
    if (r.variant && r.variant.id != null) {
      product.variants.push({
        ...r.variant,
        mrpPaise: paise(r.variant.mrpPaise),
        pricePaise: paise(r.variant.pricePaise),
      });
    }
  }

  return Array.from(bySlug.values());
}

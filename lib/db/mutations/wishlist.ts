import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "../index";
import { products, wishlistItems } from "../schema";

export async function addWishlistItem(userId: number, productId: number): Promise<void> {
  await db.insert(wishlistItems).values({ userId, productId }).onConflictDoNothing();
}

export async function removeWishlistItem(userId: number, productId: number): Promise<void> {
  await db.delete(wishlistItems).where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
}

/**
 * Merges an anonymous (localStorage) wishlist into the account's on login — union, never
 * overwrite (PROMPTS.md Phase 6 item 4). Existing account rows are left untouched; any anonymous
 * product id not already present is inserted. `onConflictDoNothing` makes this safe to call twice
 * (e.g. a retried request) without erroring on the unique (user_id, product_id) index.
 */
export async function mergeWishlistOnLogin(userId: number, anonymousProductIds: number[]): Promise<number[]> {
  const uniqueIds = [...new Set(anonymousProductIds)].filter((id) => Number.isInteger(id) && id > 0);
  if (uniqueIds.length > 0) {
    await db
      .insert(wishlistItems)
      .values(uniqueIds.map((productId) => ({ userId, productId })))
      .onConflictDoNothing();
  }
  const rows = await db.select({ productId: wishlistItems.productId }).from(wishlistItems).where(eq(wishlistItems.userId, userId));
  return rows.map((r) => r.productId);
}

/** Used only to validate that the product ids an anonymous client claims to have wishlisted are
 * real products before merging them in — never trust client-submitted ids blindly. */
export async function filterExistingProductIds(productIds: number[]): Promise<number[]> {
  if (productIds.length === 0) return [];
  const rows = await db.select({ id: products.id }).from(products).where(inArray(products.id, productIds));
  return rows.map((r) => r.id);
}

import "server-only";

import { eq, inArray } from "drizzle-orm";
import { db } from "../index";
import { cartItems, variants } from "../schema";

export interface CartMergeLine {
  variantId: number;
  qty: number;
}

/**
 * Merges the anonymous (localStorage) cart into the account's server-side cart on login — union
 * by variant, quantities summed and capped, never one side dropped (PROMPTS.md Phase 6 items 4/
 * "Cart merges the same way [as wishlist]"). Only variant ids that actually exist are written.
 * Returns the merged line list (variantId + qty only — price/stock are always re-derived by
 * lib/commerce/pricing.ts on the next revalidate, never trusted from here).
 */
export async function mergeCartOnLogin(userId: number, anonymousLines: CartMergeLine[]): Promise<CartMergeLine[]> {
  const existing = await db.select({ variantId: cartItems.variantId, qty: cartItems.qty }).from(cartItems).where(eq(cartItems.userId, userId));

  const merged = new Map<number, number>();
  for (const line of existing) merged.set(line.variantId, line.qty);
  for (const line of anonymousLines) {
    if (!Number.isInteger(line.variantId) || line.variantId <= 0) continue;
    if (!Number.isInteger(line.qty) || line.qty <= 0) continue;
    const current = merged.get(line.variantId) ?? 0;
    merged.set(line.variantId, Math.min(99, current + line.qty));
  }

  const variantIds = [...merged.keys()];
  const validVariantIds =
    variantIds.length > 0
      ? new Set((await db.select({ id: variants.id }).from(variants).where(inArray(variants.id, variantIds))).map((v) => v.id))
      : new Set<number>();

  const finalLines: CartMergeLine[] = [...merged.entries()]
    .filter(([variantId]) => validVariantIds.has(variantId))
    .map(([variantId, qty]) => ({ variantId, qty }));

  await db.transaction(async (tx) => {
    await tx.delete(cartItems).where(eq(cartItems.userId, userId));
    if (finalLines.length > 0) {
      await tx.insert(cartItems).values(finalLines.map((l) => ({ userId, variantId: l.variantId, qty: l.qty })));
    }
  });

  return finalLines;
}

/** Best-effort persistence of the current cart for a signed-in user (called after every
 * client-side cart mutation while signed in) — never the source of truth for pricing, purely so
 * the account's cart survives across devices. */
export async function replaceServerCart(userId: number, lines: CartMergeLine[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(cartItems).where(eq(cartItems.userId, userId));
    const clean = lines.filter((l) => Number.isInteger(l.variantId) && l.variantId > 0 && Number.isInteger(l.qty) && l.qty > 0);
    if (clean.length > 0) {
      await tx.insert(cartItems).values(clean.map((l) => ({ userId, variantId: l.variantId, qty: Math.min(99, l.qty) })));
    }
  });
}

export async function getServerCart(userId: number): Promise<CartMergeLine[]> {
  return db.select({ variantId: cartItems.variantId, qty: cartItems.qty }).from(cartItems).where(eq(cartItems.userId, userId));
}

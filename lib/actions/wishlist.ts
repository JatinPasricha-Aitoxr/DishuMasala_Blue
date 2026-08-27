"use server";

/**
 * Wishlist server actions (PROMPTS.md Phase 6 items 3-4). Every action independently calls
 * `requireUser()` — the redundant server-side gate for this phase's wishlist mutations, since
 * middleware.ts never runs when these are called directly (as this phase's tests do).
 */
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { addWishlistItem, removeWishlistItem, mergeWishlistOnLogin, filterExistingProductIds } from "@/lib/db/mutations/wishlist";
import { getWishlistProductIds } from "@/lib/db/queries/wishlist";

export type WishlistActionResult = { ok: true } | { ok: false; error: string };

export async function addToWishlistAction(productId: number): Promise<WishlistActionResult> {
  const session = await requireUser();
  if (!session.ok) return { ok: false, error: "You need to be signed in." };
  if (!Number.isInteger(productId) || productId <= 0) return { ok: false, error: "Invalid product" };

  await addWishlistItem(session.user.id, productId);
  revalidatePath("/account/wishlist");
  return { ok: true };
}

export async function removeFromWishlistAction(productId: number): Promise<WishlistActionResult> {
  const session = await requireUser();
  if (!session.ok) return { ok: false, error: "You need to be signed in." };
  if (!Number.isInteger(productId) || productId <= 0) return { ok: false, error: "Invalid product" };

  await removeWishlistItem(session.user.id, productId);
  revalidatePath("/account/wishlist");
  return { ok: true };
}

export async function getWishlistProductIdsAction(): Promise<number[]> {
  const session = await requireUser();
  if (!session.ok) return [];
  return getWishlistProductIds(session.user.id);
}

export type MergeWishlistResult = { ok: true; productIds: number[] } | { ok: false; error: string };

/**
 * Called once, client-side, right after a successful sign-in (components/auth/AccountSync.tsx),
 * with whatever product ids were in the anonymous localStorage wishlist store
 * (lib/store/wishlist.ts). Union with whatever the account already has — never overwrite
 * (PROMPTS.md Phase 6 item 4).
 */
export async function mergeWishlistAction(anonymousProductIds: number[]): Promise<MergeWishlistResult> {
  const session = await requireUser();
  if (!session.ok) return { ok: false, error: "You need to be signed in." };

  const cleanIds = anonymousProductIds.filter((id) => Number.isInteger(id) && id > 0).slice(0, 500);
  const validIds = await filterExistingProductIds(cleanIds);
  const merged = await mergeWishlistOnLogin(session.user.id, validIds);
  revalidatePath("/account/wishlist");
  return { ok: true, productIds: merged };
}

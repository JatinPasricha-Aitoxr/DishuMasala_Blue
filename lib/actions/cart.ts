"use server";

/**
 * Server-side cart persistence for signed-in users (PROMPTS.md Phase 6 item 4: "Cart merges the
 * same way [as wishlist]" — union on login, never drop either side). The cart's source of truth
 * for pricing/UI stays lib/store/cart.ts's Zustand+localStorage store (Phase 5, unchanged); this
 * only gives a signed-in account a durable, cross-device line list to merge into on login and to
 * persist to as the cart changes.
 *
 * `requireUser()` is the redundant server-side check here — middleware.ts never runs for a direct
 * call to this action (e.g. from a test, or components/auth/AccountSync.tsx calling it right
 * after `signIn()` resolves, before any page navigation re-triggers middleware).
 */
import { requireUser } from "@/lib/auth/session";
import { mergeCartOnLogin, replaceServerCart, type CartMergeLine } from "@/lib/db/mutations/cart";

export type MergeCartResult = { ok: true; lines: CartMergeLine[] } | { ok: false; error: string };

export async function mergeCartAction(anonymousLines: CartMergeLine[]): Promise<MergeCartResult> {
  const session = await requireUser();
  if (!session.ok) return { ok: false, error: "You need to be signed in." };

  const cleanLines = anonymousLines
    .filter((l) => Number.isInteger(l.variantId) && l.variantId > 0 && Number.isInteger(l.qty) && l.qty > 0)
    .slice(0, 200);

  const merged = await mergeCartOnLogin(session.user.id, cleanLines);
  return { ok: true, lines: merged };
}

export type SyncCartResult = { ok: true } | { ok: false; error: string };

/** Best-effort persistence after every cart mutation while signed in — never authoritative for
 * price (lib/commerce/pricing.ts always is), purely so the account's cart survives a device
 * switch. */
export async function syncServerCartAction(lines: CartMergeLine[]): Promise<SyncCartResult> {
  const session = await requireUser();
  if (!session.ok) return { ok: false, error: "You need to be signed in." };

  const cleanLines = lines.filter((l) => Number.isInteger(l.variantId) && l.variantId > 0 && Number.isInteger(l.qty) && l.qty > 0).slice(0, 200);
  await replaceServerCart(session.user.id, cleanLines);
  return { ok: true };
}

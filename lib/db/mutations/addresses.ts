import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { addresses } from "../schema";
import type { AddressInput } from "@/lib/commerce/address";

export type AddressMutationResult = { ok: true; addressId: number } | { ok: false; error: "not_found" };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Clears every other default flag for this user inside the same transaction as the write that
 * sets a new one — "one marked default" (PROMPTS.md Phase 6 item 3) is a real invariant, not just
 * a UI convention, so it's enforced here rather than trusted to the caller. */
async function clearOtherDefaults(tx: Tx, userId: number, exceptId?: number): Promise<void> {
  await tx
    .update(addresses)
    .set({ isDefault: false })
    .where(exceptId ? and(eq(addresses.userId, userId), sql`${addresses.id} <> ${exceptId}`) : eq(addresses.userId, userId));
}

export async function createAddress(userId: number, input: AddressInput & { label: string | null; isDefault: boolean }): Promise<AddressMutationResult> {
  return db.transaction(async (tx) => {
    // The very first address for an account is always the default, regardless of what the form
    // said — there must always be exactly one default once any address exists.
    const [{ count }] = await tx.select({ count: sql<number>`count(*)` }).from(addresses).where(eq(addresses.userId, userId));
    const makeDefault = input.isDefault || Number(count) === 0;

    const [row] = await tx
      .insert(addresses)
      .values({
        userId,
        label: input.label,
        name: input.name,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        isDefault: makeDefault,
      })
      .returning({ id: addresses.id });

    if (makeDefault) await clearOtherDefaults(tx, userId, row.id);
    return { ok: true, addressId: row.id };
  });
}

/** Every mutation here re-checks `userId` in its WHERE clause — an address id from the URL/form
 * is never sufficient authorization on its own (PROMPTS.md Phase 6 item 3). */
export async function updateAddress(
  addressId: number,
  userId: number,
  input: AddressInput & { label: string | null; isDefault: boolean },
): Promise<AddressMutationResult> {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(addresses)
      .set({
        label: input.label,
        name: input.name,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        isDefault: input.isDefault,
      })
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .returning({ id: addresses.id });

    if (updated.length === 0) return { ok: false, error: "not_found" };
    if (input.isDefault) await clearOtherDefaults(tx, userId, addressId);
    return { ok: true, addressId };
  });
}

export async function deleteAddress(addressId: number, userId: number): Promise<{ ok: true } | { ok: false; error: "not_found" }> {
  return db.transaction(async (tx) => {
    const deleted = await tx
      .delete(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .returning({ id: addresses.id, wasDefault: addresses.isDefault });

    if (deleted.length === 0) return { ok: false, error: "not_found" };

    if (deleted[0].wasDefault) {
      // Promote the most recently added remaining address to default so the invariant ("one
      // marked default" whenever any address exists) survives a delete.
      const [next] = await tx.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, userId)).orderBy(sql`${addresses.createdAt} desc`).limit(1);
      if (next) await tx.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id));
    }
    return { ok: true };
  });
}

export async function setDefaultAddress(addressId: number, userId: number): Promise<{ ok: true } | { ok: false; error: "not_found" }> {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(addresses)
      .set({ isDefault: true })
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .returning({ id: addresses.id });
    if (updated.length === 0) return { ok: false, error: "not_found" };
    await clearOtherDefaults(tx, userId, addressId);
    return { ok: true };
  });
}

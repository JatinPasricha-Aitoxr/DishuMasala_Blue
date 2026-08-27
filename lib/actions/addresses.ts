"use server";

/**
 * app/account/addresses server actions (PROMPTS.md Phase 6 item 3). Every action re-checks
 * `requireUser()` itself (the redundant server-side gate for this phase's address CRUD) and every
 * mutation on an existing address is scoped by `userId` inside lib/db/mutations/addresses.ts's own
 * WHERE clause — an address id from a form is never trusted as sufficient authorization on its own.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { addressSchema } from "@/lib/commerce/address";
import { createAddress, updateAddress, deleteAddress, setDefaultAddress } from "@/lib/db/mutations/addresses";

const addressFormSchema = addressSchema.extend({
  label: z.string().trim().max(40).optional().or(z.literal("")).transform((v) => (v ? v : null)),
  isDefault: z.boolean().optional().default(false),
});

export type AddressFormInput = z.infer<typeof addressFormSchema>;
export type AddressActionResult = { ok: true } | { ok: false; error: string };

export async function createAddressAction(input: AddressFormInput): Promise<AddressActionResult> {
  const session = await requireUser();
  if (!session.ok) return { ok: false, error: "You need to be signed in." };

  const parsed = addressFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid address" };

  await createAddress(session.user.id, parsed.data);
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function updateAddressAction(addressId: number, input: AddressFormInput): Promise<AddressActionResult> {
  const session = await requireUser();
  if (!session.ok) return { ok: false, error: "You need to be signed in." };
  if (!Number.isInteger(addressId) || addressId <= 0) return { ok: false, error: "Invalid address" };

  const parsed = addressFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid address" };

  const result = await updateAddress(addressId, session.user.id, parsed.data);
  if (!result.ok) return { ok: false, error: "Address not found." };
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddressAction(addressId: number): Promise<AddressActionResult> {
  const session = await requireUser();
  if (!session.ok) return { ok: false, error: "You need to be signed in." };
  if (!Number.isInteger(addressId) || addressId <= 0) return { ok: false, error: "Invalid address" };

  const result = await deleteAddress(addressId, session.user.id);
  if (!result.ok) return { ok: false, error: "Address not found." };
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function setDefaultAddressAction(addressId: number): Promise<AddressActionResult> {
  const session = await requireUser();
  if (!session.ok) return { ok: false, error: "You need to be signed in." };
  if (!Number.isInteger(addressId) || addressId <= 0) return { ok: false, error: "Invalid address" };

  const result = await setDefaultAddress(addressId, session.user.id);
  if (!result.ok) return { ok: false, error: "Address not found." };
  revalidatePath("/account/addresses");
  return { ok: true };
}

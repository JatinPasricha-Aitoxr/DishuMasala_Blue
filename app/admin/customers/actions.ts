"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { updateCustomerContactDb } from "@/lib/db/mutations/admin-customers";
import { getAdminCustomerById } from "@/lib/db/queries/admin-customers";

export type AdminResult = { ok: true; message: string } | { ok: false; error: string };

const schema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1, "Name is required").max(200),
  phone: z.string().trim().regex(/^\d{10}$/, "Enter a 10-digit phone number").or(z.literal("")).nullable(),
});

/** Correcting a name/phone — nothing else. No password field, no impersonation. */
export async function updateCustomerContactAction(input: z.infer<typeof schema>): Promise<AdminResult> {
  const session = await requireStaffOrAdmin();
  if (!session.ok) return { ok: false, error: session.error === "unauthenticated" ? "Sign in required." : "Staff access required." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await getAdminCustomerById(parsed.data.id);
  if (!existing) return { ok: false, error: "Customer not found." };

  const phone = parsed.data.phone || null;
  await updateCustomerContactDb(parsed.data.id, parsed.data.name, phone);
  await writeAuditLog({
    actorUserId: session.user.id,
    action: "customer.update_contact",
    entity: "user",
    entityId: parsed.data.id,
    diff: { name: existing.name === parsed.data.name ? undefined : { from: existing.name, to: parsed.data.name }, phone: existing.phone === phone ? undefined : { from: existing.phone, to: phone } },
  });
  revalidatePath(`/admin/customers/${parsed.data.id}`);
  return { ok: true, message: "Customer details saved." };
}

"use server";

/**
 * Coupon admin mutations (PROMPTS.md Phase 8 item 3). Every field offered here maps 1:1 to a rule
 * `lib/commerce/pricing.ts`'s `validateCoupon`/`computeCouponDiscountPaise` actually enforces at
 * checkout — kind, value, minSpendPaise, maxDiscountPaise, firstOrderOnly, usageLimit,
 * perUserLimit, startsAt/endsAt, active, appliesTo (productIds/collectionIds). Nothing is offered
 * here that pricing.ts doesn't genuinely check ("A rule that cannot be enforced must not be
 * offerable in the UI" — PROMPTS.md).
 */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { createCouponDb, updateCouponDb, type CouponInput } from "@/lib/db/mutations/admin-coupons";
import { isCouponCodeTaken, getAdminCouponById } from "@/lib/db/queries/admin-coupons";

export type AdminResult<T = undefined> = { ok: true; message: string; data?: T } | { ok: false; error: string };

async function requireStaff() {
  const session = await requireStaffOrAdmin();
  if (!session.ok) {
    return { ok: false as const, error: session.error === "unauthenticated" ? "Sign in required." : "Staff access required." };
  }
  return { ok: true as const, user: session.user };
}

const couponSchema = z
  .object({
    code: z.string().trim().min(2, "Code is required").max(30).regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, hyphens and underscores only"),
    kind: z.enum(["percent", "fixed"]),
    value: z.coerce.number().int().positive("Value must be a positive whole number"),
    minSpendRupees: z.coerce.number().min(0).nullable(),
    maxDiscountRupees: z.coerce.number().min(0).nullable(),
    firstOrderOnly: z.boolean(),
    usageLimit: z.coerce.number().int().positive().nullable(),
    perUserLimit: z.coerce.number().int().positive().nullable(),
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
    active: z.boolean(),
    productIds: z.array(z.number().int().positive()),
    collectionIds: z.array(z.number().int().positive()),
  })
  .refine((v) => v.kind !== "percent" || v.value <= 100, { message: "A percent coupon can't exceed 100", path: ["value"] });

function toDbInput(parsed: z.infer<typeof couponSchema>): CouponInput {
  const appliesTo =
    parsed.productIds.length || parsed.collectionIds.length
      ? { productIds: parsed.productIds.length ? parsed.productIds : undefined, collectionIds: parsed.collectionIds.length ? parsed.collectionIds : undefined }
      : null;
  return {
    code: parsed.code,
    kind: parsed.kind,
    value: parsed.value,
    minSpendPaise: parsed.minSpendRupees != null ? Math.round(parsed.minSpendRupees * 100) : null,
    maxDiscountPaise: parsed.maxDiscountRupees != null ? Math.round(parsed.maxDiscountRupees * 100) : null,
    firstOrderOnly: parsed.firstOrderOnly,
    usageLimit: parsed.usageLimit,
    perUserLimit: parsed.perUserLimit,
    startsAt: parsed.startsAt ? new Date(parsed.startsAt) : null,
    endsAt: parsed.endsAt ? new Date(parsed.endsAt) : null,
    active: parsed.active,
    appliesTo,
  };
}

export async function checkCouponCodeAvailableAction(code: string, excludeId?: number): Promise<{ available: boolean }> {
  const auth = await requireStaff();
  if (!auth.ok) return { available: false };
  return { available: !(await isCouponCodeTaken(code, excludeId)) };
}

export async function createCouponAction(input: z.infer<typeof couponSchema>): Promise<AdminResult<{ id: number }>> {
  const auth = await requireStaff();
  if (!auth.ok) return auth;

  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  if (await isCouponCodeTaken(parsed.data.code)) {
    return { ok: false, error: `The code "${parsed.data.code.toUpperCase()}" is already in use.` };
  }

  const dbInput = toDbInput(parsed.data);
  const id = await createCouponDb(dbInput);
  await writeAuditLog({ actorUserId: auth.user.id, action: "coupon.create", entity: "coupon", entityId: id, diff: { code: dbInput.code, kind: dbInput.kind, value: dbInput.value } });
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon created.", data: { id } };
}

export async function updateCouponAction(id: number, input: z.infer<typeof couponSchema>): Promise<AdminResult> {
  const auth = await requireStaff();
  if (!auth.ok) return auth;

  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await getAdminCouponById(id);
  if (!existing) return { ok: false, error: "Coupon not found." };

  if (await isCouponCodeTaken(parsed.data.code, id)) {
    return { ok: false, error: `The code "${parsed.data.code.toUpperCase()}" is already in use.` };
  }

  const dbInput = toDbInput(parsed.data);
  await updateCouponDb(id, dbInput);
  await writeAuditLog({
    actorUserId: auth.user.id,
    action: "coupon.update",
    entity: "coupon",
    entityId: id,
    diff: { active: existing.active === dbInput.active ? undefined : { from: existing.active, to: dbInput.active }, value: dbInput.value },
  });
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon saved." };
}

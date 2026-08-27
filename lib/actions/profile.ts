"use server";

/**
 * app/account/profile server actions (PROMPTS.md Phase 6 item 3). Every action here independently
 * calls `requireUser()` (lib/auth/session.ts) — this is the redundant server-side check for this
 * phase's profile/password mutations; middleware.ts is only the first gate, never trusted alone.
 */
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/queries/users";
import { updateProfile, updatePasswordHash } from "@/lib/db/mutations/users";
import { hashPassword, verifyPasswordHash } from "@/lib/auth/password";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfileAction(input: z.infer<typeof profileSchema>): Promise<UpdateProfileResult> {
  const session = await requireUser();
  if (!session.ok) return { ok: false, error: "You need to be signed in." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };

  await updateProfile(session.user.id, { name: parsed.data.name, phone: parsed.data.phone });
  return { ok: true };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "Use at least 8 characters").max(200),
});

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

/** Re-verifies the CURRENT password before accepting a new one (PROMPTS.md Phase 6 item 3) —
 * never just trusts that the caller is signed in as reason enough to change it. */
export async function changePasswordAction(input: z.infer<typeof changePasswordSchema>): Promise<ChangePasswordResult> {
  const session = await requireUser();
  if (!session.ok) return { ok: false, error: "You need to be signed in." };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const user = await getUserById(session.user.id);
  if (!user) return { ok: false, error: "Account not found." };

  const valid = await verifyPasswordHash(user.passwordHash, parsed.data.currentPassword);
  if (!valid) return { ok: false, error: "Current password is incorrect." };

  const newHash = await hashPassword(parsed.data.newPassword);
  await updatePasswordHash(user.id, newHash);
  return { ok: true };
}

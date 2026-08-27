import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../index";
import { users } from "../schema";
import { hashPassword } from "@/lib/auth/password";

/** Postgres unique-violation code, same convention as lib/db/mutations/orders.ts. */
function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const direct = (err as { code?: unknown }).code;
  if (direct === "23505") return true;
  const cause = (err as { cause?: unknown }).cause;
  return typeof cause === "object" && cause !== null && (cause as { code?: unknown }).code === "23505";
}

export type CreateUserResult = { ok: true; userId: number } | { ok: false; error: "email_taken" };

/** Registers a new customer. Email is stored lower-cased so the DB unique index
 * (`users_email_uniq`) and every case-insensitive lookup (lib/db/queries/users.ts) agree. */
export async function createUser(input: { email: string; name: string; phone: string | null; password: string }): Promise<CreateUserResult> {
  const passwordHash = await hashPassword(input.password);
  try {
    const [row] = await db
      .insert(users)
      .values({
        email: input.email.trim().toLowerCase(),
        name: input.name.trim(),
        phone: input.phone,
        passwordHash,
        role: "customer",
      })
      .returning({ id: users.id });
    return { ok: true, userId: row.id };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, error: "email_taken" };
    throw err;
  }
}

export async function markEmailVerified(userId: number): Promise<void> {
  await db.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function markLastLogin(userId: number): Promise<void> {
  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updatePasswordHash(userId: number, newPasswordHash: string): Promise<void> {
  await db.update(users).set({ passwordHash: newPasswordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateProfile(userId: number, input: { name: string; phone: string | null }): Promise<void> {
  await db.update(users).set({ name: input.name.trim(), phone: input.phone, updatedAt: new Date() }).where(eq(users.id, userId));
}

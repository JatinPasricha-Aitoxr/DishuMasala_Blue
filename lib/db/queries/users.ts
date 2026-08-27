import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../index";
import { users } from "../schema";

export interface UserRecord {
  id: number;
  email: string;
  phone: string | null;
  name: string;
  passwordHash: string;
  role: "customer" | "staff" | "admin";
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
}

/** Case-insensitive lookup — emails are stored as submitted but must never let
 * `Foo@Bar.com` and `foo@bar.com` be treated as different accounts. */
export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}

export async function getUserById(id: number): Promise<UserRecord | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

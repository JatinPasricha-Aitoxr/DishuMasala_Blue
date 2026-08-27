import "server-only";

/**
 * The ONLY customer-record write this admin section exposes: correcting a name or phone number
 * (PROMPTS.md Phase 8 item 5). No password field, no "login as this customer" capability exists
 * anywhere in this file or its caller (app/admin/customers/actions.ts) — CLAUDE.md/PROMPTS.md
 * explicitly forbid both, "even as a 'for support purposes' convenience".
 */
import { eq } from "drizzle-orm";
import { db } from "../index";
import { users } from "../schema";

export async function updateCustomerContactDb(id: number, name: string, phone: string | null): Promise<void> {
  await db.update(users).set({ name, phone, updatedAt: new Date() }).where(eq(users.id, id));
}

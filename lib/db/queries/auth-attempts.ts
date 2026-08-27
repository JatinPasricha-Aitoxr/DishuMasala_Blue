import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../index";
import { authAttempts } from "../schema";

/** Backs lib/rate-limit.ts — counts real `auth_attempts` rows in a rolling window (CLAUDE.md §3.2:
 * no ORM import outside lib/db/, so this file is the only thing touching the table directly). */
export async function countRecentAuthAttempts(action: string, identifierHash: string, windowMinutes: number): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(authAttempts)
    .where(and(eq(authAttempts.action, action), eq(authAttempts.identifierHash, identifierHash), gte(authAttempts.createdAt, since)));
  return Number(row?.n ?? 0);
}

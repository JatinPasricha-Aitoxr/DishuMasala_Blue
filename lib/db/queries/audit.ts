import "server-only";

/** Reads back audit_log rows for one entity — backs the order detail page's "full status timeline
 * reconstructed from audit_log rows" (PROMPTS.md Phase 7 item 4). */
import { asc, and, eq } from "drizzle-orm";
import { db } from "../index";
import { auditLog, users } from "../schema";

export interface AuditLogEntry {
  id: number;
  actorUserId: number | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  diff: unknown;
  createdAt: Date;
}

export async function getAuditLogForEntity(entity: string, entityId: string | number): Promise<AuditLogEntry[]> {
  const rows = await db
    .select({
      id: auditLog.id,
      actorUserId: auditLog.actorUserId,
      actorName: users.name,
      actorEmail: users.email,
      action: auditLog.action,
      diff: auditLog.diff,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorUserId))
    .where(and(eq(auditLog.entity, entity), eq(auditLog.entityId, String(entityId))))
    .orderBy(asc(auditLog.createdAt));
  return rows;
}

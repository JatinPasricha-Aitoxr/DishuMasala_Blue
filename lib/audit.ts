import "server-only";

/**
 * The one place every admin mutation writes an `audit_log` row (CLAUDE.md §3.6 / §9: "Every
 * mutation writes `audit_log` and calls `revalidateTag`") — no admin server action hand-rolls its
 * own insert. `diff` should describe what actually changed (before/after, or the meaningful
 * payload of the action), never just a flag that "something changed".
 */
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

export interface WriteAuditLogInput {
  /** The signed-in staff/admin user who performed the action. Null only for a genuinely
   * system-initiated event (none exist in this phase — every admin action re-checks a real
   * session first, so this is realistically always set). */
  actorUserId: number | null;
  /** A short, stable verb — e.g. "order.status_transition", "order.dispatch", "order.refund". */
  action: string;
  /** The entity type — "order", "settings", etc. */
  entity: string;
  entityId: string | number;
  /** A real diff of what changed. Keep it small and structured (before/after), not free text. */
  diff?: Record<string, unknown> | null;
}

export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  await db.insert(auditLog).values({
    actorUserId: input.actorUserId,
    action: input.action,
    entity: input.entity,
    entityId: String(input.entityId),
    diff: input.diff ?? null,
  });
}

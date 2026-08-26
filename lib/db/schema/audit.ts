import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditLog = pgTable("audit_log", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  // Nullable and SET NULL on delete: an audit trail must survive the deletion of the actor's
  // account — it records what happened, not a live reference to who is still around to own it.
  actorUserId: integer("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text().notNull(),
  entity: text().notNull(),
  entityId: text("entity_id").notNull(),
  diff: jsonb(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

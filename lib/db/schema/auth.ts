import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { variants } from "./catalog";

/**
 * DB-backed rate limiting for auth-sensitive actions (PROMPTS.md Phase 6 item 1), generalising
 * the pattern lib/db/mutations/reviews.ts established in Phase 4 (count real rows in a rolling
 * window rather than an in-memory map — CLAUDE.md §11, "this app is meant to run serverless").
 * Reviews could count its own table because a review row already existed per submission; auth
 * actions (a failed login, a reset request) have no natural row to count, so this table exists
 * purely to record attempts.
 *
 * One row per attempt. `identifierHash` is a SHA-256 hex digest of `${kind}:${value}` (kind is
 * "ip" or "email", baked into the hash input rather than a separate column) — never the raw IP or
 * email, same discipline as `reviews.ip_hash`. `action` distinguishes login/register/reset-request/
 * reset-confirm/guest-order-lookup so limits are independent per action.
 */
export const authAttempts = pgTable("auth_attempts", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  action: text().notNull(),
  identifierHash: text("identifier_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("auth_attempts_action_identifier_created_at_idx").on(t.action, t.identifierHash, t.createdAt),
]);

/**
 * A minimal server-side representation of a signed-in user's cart (PROMPTS.md Phase 6 item 4 /
 * "Cart merges the same way [as wishlist]"). The cart itself is still client Zustand +
 * localStorage (lib/store/cart.ts, Phase 5) for both anonymous and signed-in shoppers — this
 * table exists only so a signed-in user's cart survives across devices/browsers and so
 * merge-on-login has a real account-side list to merge into, not just an always-empty stub.
 * lib/db/mutations/cart.ts#mergeCartOnLogin is the only writer.
 */
export const cartItems = pgTable("cart_items", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").notNull().references(() => variants.id, { onDelete: "cascade" }),
  qty: integer().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("cart_items_user_id_variant_id_uniq").on(t.userId, t.variantId),
]);

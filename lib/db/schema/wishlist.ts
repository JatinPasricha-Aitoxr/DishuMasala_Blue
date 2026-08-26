import { integer, pgTable, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { products } from "./catalog";
import { users } from "./users";

export const wishlistItems = pgTable("wishlist_items", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("wishlist_items_user_id_product_id_uniq").on(t.userId, t.productId),
  // CLAUDE.md §6 requires an index on wishlist_items.user_id specifically; the composite unique
  // index above already leads with user_id so it also serves single-column user_id lookups.
]);

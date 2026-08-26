import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const pincodeCache = pgTable("pincode_cache", {
  pincode: text().primaryKey(),
  serviceable: boolean().notNull(),
  codAvailable: boolean("cod_available").notNull(),
  etaDays: integer("eta_days"),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
});

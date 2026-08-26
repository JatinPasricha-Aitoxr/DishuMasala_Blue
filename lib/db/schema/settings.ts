import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
});

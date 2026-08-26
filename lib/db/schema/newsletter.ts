import { integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const newsletterSubs = pgTable("newsletter_subs", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  email: text().notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  source: text(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("newsletter_subs_email_uniq").on(t.email),
]);

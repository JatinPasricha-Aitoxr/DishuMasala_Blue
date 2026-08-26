import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";

export const users = pgTable("users", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  email: text().notNull(),
  phone: text(),
  name: text().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum().notNull().default("customer"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("users_email_uniq").on(t.email),
]);

export const addresses = pgTable("addresses", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text(),
  name: text().notNull(),
  phone: text().notNull(),
  line1: text().notNull(),
  line2: text(),
  city: text().notNull(),
  state: text().notNull(),
  pincode: text().notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("addresses_user_id_idx").on(t.userId),
]);

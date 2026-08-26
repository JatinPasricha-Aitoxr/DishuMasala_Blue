import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { couponKindEnum } from "./enums";
import { orders } from "./orders";
import { users } from "./users";

export const coupons = pgTable("coupons", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  code: text().notNull(),
  kind: couponKindEnum().notNull(),
  value: integer().notNull(),
  minSpendPaise: integer("min_spend_paise"),
  maxDiscountPaise: integer("max_discount_paise"),
  firstOrderOnly: boolean("first_order_only").notNull().default(false),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  perUserLimit: integer("per_user_limit"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  active: boolean().notNull().default(true),
  // Which collections/products a coupon applies to; {} / null means "all".
  appliesTo: jsonb("applies_to"),
}, (t) => [
  uniqueIndex("coupons_code_uniq").on(t.code),
]);

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  couponId: integer("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  // Never cascade an order away — a redemption record must not be able to trigger the deletion
  // of the order it belongs to, nor be silently orphaned by one.
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("coupon_redemptions_coupon_id_idx").on(t.couponId),
  index("coupon_redemptions_order_id_idx").on(t.orderId),
  index("coupon_redemptions_user_id_idx").on(t.userId),
]);

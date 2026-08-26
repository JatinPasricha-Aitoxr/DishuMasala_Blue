import {
  index,
  integer,
  jsonb,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { orderStatusEnum, paymentMethodEnum, paymentStatusEnum } from "./enums";
import { users } from "./users";
import { variants } from "./catalog";

/**
 * Backs the human-readable order number (DM-YYYY-NNNNN). See lib/db/order-number.ts for the
 * formatting helper that turns a nextval() into that string.
 */
export const orderNumberSeq = pgSequence("order_number_seq", {
  startWith: 1,
  increment: 1,
  minValue: 1,
});

export const orders = pgTable("orders", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  orderNumber: text("order_number").notNull(),
  // Nullable — guest checkout is allowed (CLAUDE.md §9 / PRD §5.4).
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text().notNull(),
  phone: text().notNull(),
  status: orderStatusEnum().notNull().default("pending"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  subtotalPaise: integer("subtotal_paise").notNull(),
  discountPaise: integer("discount_paise").notNull().default(0),
  shippingPaise: integer("shipping_paise").notNull().default(0),
  totalPaise: integer("total_paise").notNull(),
  couponCode: text("coupon_code"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  shippingAddress: jsonb("shipping_address").notNull(),
  billingAddress: jsonb("billing_address"),
  shiprocketOrderId: text("shiprocket_order_id"),
  awb: text(),
  courier: text(),
  trackingUrl: text("tracking_url"),
  customerNote: text("customer_note"),
  staffNote: text("staff_note"),
  placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("orders_order_number_uniq").on(t.orderNumber),
  index("orders_status_placed_at_idx").on(t.status, t.placedAt),
  index("orders_user_id_idx").on(t.userId),
]);

export const orderItems = pgTable("order_items", {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  // Orders and order_items are never cascade-deleted (CLAUDE.md §6). Restrict blocks deleting an
  // order out from under its line items at the database level, as a backstop to the app-level
  // rule that orders are never deletable at all.
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  // Nullable, and SET NULL on delete: order_items store a full price/name snapshot independent of
  // the live variant, so deleting a variant later must never delete or corrupt historical orders.
  variantId: integer("variant_id").references(() => variants.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  optionValue: text("option_value").notNull(),
  sku: text().notNull(),
  mrpPaise: integer("mrp_paise").notNull(),
  unitPricePaise: integer("unit_price_paise").notNull(),
  qty: integer().notNull(),
  lineTotalPaise: integer("line_total_paise").notNull(),
  imageR2Key: text("image_r2_key"),
}, (t) => [
  index("order_items_order_id_idx").on(t.orderId),
]);

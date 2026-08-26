import { pgEnum } from "drizzle-orm/pg-core";

// Shared across users.ts only, but centralised here alongside the other enums so every allowed
// value in the schema is discoverable from one file.
export const userRoleEnum = pgEnum("user_role", ["customer", "staff", "admin"]);

// Shared by products, posts and pages — all three have the identical draft/published lifecycle.
export const contentStatusEnum = pgEnum("content_status", ["draft", "published"]);

export const couponKindEnum = pgEnum("coupon_kind", ["percent", "fixed"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["razorpay", "cod"]);

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);

export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected"]);

export const postKindEnum = pgEnum("post_kind", ["blog", "recipe"]);

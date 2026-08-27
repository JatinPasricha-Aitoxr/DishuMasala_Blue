import "server-only";

import { and, count, eq } from "drizzle-orm";
import { db } from "../index";
import { coupons, couponRedemptions, orders } from "../schema";

export interface CouponRow {
  id: number;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  minSpendPaise: number | null;
  maxDiscountPaise: number | null;
  firstOrderOnly: boolean;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  appliesTo: unknown;
}

/** Coupon codes are matched case-insensitively (WELCOME5 == welcome5) but stored as seeded. */
export async function getCouponByCode(code: string): Promise<CouponRow | null> {
  const [row] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.trim().toUpperCase()))
    .limit(1);
  return row ?? null;
}

/** How many times this coupon has already been redeemed by this guest email — there is no auth
 * yet, so "per-user" means "per checkout email" (matches the task brief's guest-identity rule). */
export async function countCouponRedemptionsByEmail(couponId: number, email: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(couponRedemptions)
    .innerJoin(orders, eq(orders.id, couponRedemptions.orderId))
    .where(and(eq(couponRedemptions.couponId, couponId), eq(orders.email, email)));
  return Number(row?.n ?? 0);
}

/**
 * Whether any order already exists for this email — the "first order" test for `firstOrderOnly`
 * coupons like WELCOME5. Deliberately counts every order row regardless of status: an order is
 * inserted (as `pending`) the moment checkout's transaction commits, before payment is confirmed,
 * so a still-pending or even a failed/cancelled attempt already establishes "this email has
 * ordered before" — the simplest, least game-able reading of the rule.
 */
export async function hasAnyOrderForEmail(email: string): Promise<boolean> {
  const [row] = await db.select({ id: orders.id }).from(orders).where(eq(orders.email, email)).limit(1);
  return row != null;
}

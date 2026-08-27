import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "../index";
import { orderItems, orders } from "../schema";
import { paise } from "@/lib/money";
import type { Order, OrderAddress } from "@/types/order";

function toOrder(row: typeof orders.$inferSelect, items: (typeof orderItems.$inferSelect)[]): Order {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    email: row.email,
    phone: row.phone,
    status: row.status,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    subtotalPaise: paise(row.subtotalPaise),
    discountPaise: paise(row.discountPaise),
    shippingPaise: paise(row.shippingPaise),
    totalPaise: paise(row.totalPaise),
    couponCode: row.couponCode,
    razorpayOrderId: row.razorpayOrderId,
    razorpayPaymentId: row.razorpayPaymentId,
    shippingAddress: row.shippingAddress as OrderAddress,
    billingAddress: row.billingAddress as OrderAddress | null,
    shiprocketOrderId: row.shiprocketOrderId,
    awb: row.awb,
    courier: row.courier,
    trackingUrl: row.trackingUrl,
    customerNote: row.customerNote,
    staffNote: row.staffNote,
    placedAt: row.placedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: items.map((i) => ({
      id: i.id,
      orderId: i.orderId,
      variantId: i.variantId,
      productName: i.productName,
      optionValue: i.optionValue,
      sku: i.sku,
      mrpPaise: paise(i.mrpPaise),
      unitPricePaise: paise(i.unitPricePaise),
      qty: i.qty,
      lineTotalPaise: paise(i.lineTotalPaise),
      imageR2Key: i.imageR2Key,
    })),
  };
}

async function loadOrderWithItems(orderId: number): Promise<Order | null> {
  const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!row) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).orderBy(asc(orderItems.id));
  return toOrder(row, items);
}

export async function getOrderByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
  const [row] = await db.select({ id: orders.id }).from(orders).where(eq(orders.idempotencyKey, idempotencyKey)).limit(1);
  if (!row) return null;
  return loadOrderWithItems(row.id);
}

export async function getOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  const [row] = await db.select({ id: orders.id }).from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!row) return null;
  return loadOrderWithItems(row.id);
}

export async function getOrderByRazorpayOrderId(razorpayOrderId: string): Promise<Order | null> {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.razorpayOrderId, razorpayOrderId))
    .limit(1);
  if (!row) return null;
  return loadOrderWithItems(row.id);
}

export async function getOrderById(orderId: number): Promise<Order | null> {
  return loadOrderWithItems(orderId);
}

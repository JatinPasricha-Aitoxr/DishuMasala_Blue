"use server";

/**
 * Guest order lookup, second path (PROMPTS.md Phase 6 item 5). The first path is the signed link
 * Phase 5's confirmation email already sends (lib/order-token.ts, app/order/[orderNumber]/page.tsx —
 * unchanged by this phase). This is the fallback for someone who lost that email: an order-number +
 * email form. On a match it re-issues a fresh signed link and hands it back for the client to
 * follow, rather than rendering order details inline here — one real mechanism for "prove you know
 * this order" (the signed token) instead of two, and the existing page already has the ownership
 * check, 404-on-mismatch, and rate-limit-adjacent ("token must match") behaviour proven in Phase 5.
 *
 * No enumeration: a wrong order number and a right order number with the wrong email produce the
 * exact same generic error — the caller can never learn which part of their guess was wrong.
 * Rate-limited by IP and by the email guessed, same DB-backed pattern as every other auth action
 * (lib/rate-limit.ts).
 */
import { headers } from "next/headers";
import { z } from "zod";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { getOrderByOrderNumber } from "@/lib/db/queries/orders";
import { buildOrderConfirmationUrl } from "@/lib/order-token";

const schema = z.object({
  orderNumber: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(200),
});

export type GuestOrderLookupResult = { ok: true; url: string } | { ok: false; error: string };

const GENERIC_ERROR = "We couldn't find a matching order. Check your order number and email and try again.";

export async function guestOrderLookupAction(input: { orderNumber: string; email: string }): Promise<GuestOrderLookupResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const { allowed } = await checkRateLimit("guest_order_lookup", { ip, email: parsed.data.email });
  if (!allowed) return { ok: false, error: "Too many attempts. Please try again later." };

  const order = await getOrderByOrderNumber(parsed.data.orderNumber.trim().toUpperCase());
  if (!order || order.email.toLowerCase() !== parsed.data.email.trim().toLowerCase()) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const url = buildOrderConfirmationUrl(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", order.orderNumber, order.email);
  return { ok: true, url };
}

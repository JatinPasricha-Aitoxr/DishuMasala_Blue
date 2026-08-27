import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyCheckoutSignature } from "@/lib/razorpay/signature";
import { getOrderByRazorpayOrderId } from "@/lib/db/queries/orders";
import { finalizeOrderPayment } from "@/lib/commerce/order-fulfillment";

/**
 * The client-side "verify" fast path (PROMPTS.md Phase 5 item 7): Razorpay's checkout hands the
 * browser `razorpay_order_id`/`razorpay_payment_id`/`razorpay_signature` on success, and this
 * route confirms them with a timing-safe HMAC compare before doing anything. This is a UX
 * improvement, not the actual confirmation authority — `app/api/payment/webhook/route.ts` is the
 * source of truth (CLAUDE.md §4/§7.5) and both converge on the same idempotent
 * `finalizeOrderPayment` (lib/commerce/order-fulfillment.ts), safe to call from both, in any order.
 */
const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "invalid_input", message: "Request body must be JSON." } }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "invalid_input", message: "Missing or malformed payment details." } },
      { status: 400 },
    );
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { ok: false, error: { code: "not_configured", message: "Payments are not configured on this server." } },
      { status: 503 },
    );
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;
  const validSignature = verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, keySecret);
  if (!validSignature) {
    return NextResponse.json(
      { ok: false, error: { code: "invalid_signature", message: "Payment could not be verified." } },
      { status: 400 },
    );
  }

  try {
    const order = await getOrderByRazorpayOrderId(razorpayOrderId);
    if (!order) {
      return NextResponse.json({ ok: false, error: { code: "not_found", message: "Order not found." } }, { status: 404 });
    }

    const result = await finalizeOrderPayment(order.id, razorpayPaymentId);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: { code: "conflict", message: "This payment could not be applied to your order." } },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "internal_error", message: "Something went wrong confirming your payment." } },
      { status: 500 },
    );
  }
}

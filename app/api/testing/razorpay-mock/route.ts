import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { __setTestRazorpayClient, type RazorpayClient } from "@/lib/razorpay/client";
import { signCheckoutPayload } from "@/lib/razorpay/signature";

/**
 * Test-only control surface for Playwright's "mocked Razorpay success" run (PROMPTS.md Phase 5:
 * "browse → ... → mocked Razorpay success → confirmation"). No real Razorpay account exists in
 * this environment — this route lets an e2e test arm a fake `RazorpayClient` (order creation with
 * no network call) and, once the app's own checkout flow has created an order against it,
 * "capture" a payment for it by computing a REAL, validly-signed HMAC with the actual
 * `RAZORPAY_KEY_SECRET` — so `app/api/payment/verify/route.ts`'s signature check, and everything
 * downstream of it (finalizeOrderPayment, email, Shiprocket push), run completely for real. Only
 * the third-party Razorpay checkout iframe/API itself is replaced.
 *
 * Guarded to 404 whenever NODE_ENV is "production" — `next build && next start` always sets that,
 * so this route is structurally unreachable outside a dev/test run regardless of any other config.
 * Deliberately NOT under a `_`/`__`-prefixed folder: Next.js excludes those from routing entirely
 * (an early version of this route lived at app/api/__test__/... and silently 404'd for that exact
 * reason, caught by the Playwright test this route exists for).
 */
function blockedInProduction(): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "not_available" }, { status: 404 });
  }
  return null;
}

export async function POST(req: Request): Promise<NextResponse> {
  const blocked = blockedInProduction();
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as { action?: string; orderId?: string };

  if (body.action === "arm") {
    const keyId = "rzp_test_mock_key_id";
    const fakeClient: RazorpayClient = {
      keyId,
      async createOrder(input) {
        return { id: `order_mock_${randomUUID().replace(/-/g, "")}`, amountPaise: input.amountPaise, currency: "INR" };
      },
    };
    __setTestRazorpayClient(fakeClient);
    return NextResponse.json({ ok: true, keyId });
  }

  if (body.action === "disarm") {
    __setTestRazorpayClient(undefined);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "capture") {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || !body.orderId) {
      return NextResponse.json({ ok: false, error: "missing_secret_or_order" }, { status: 400 });
    }
    const paymentId = `pay_mock_${randomUUID().replace(/-/g, "")}`;
    const signature = signCheckoutPayload(body.orderId, paymentId, secret);
    return NextResponse.json({ ok: true, paymentId, signature });
  }

  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
}

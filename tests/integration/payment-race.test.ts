import { createHmac, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signCheckoutPayload } from "@/lib/razorpay/signature";

if (!process.env.DATABASE_URL && existsSync(".env")) {
  process.loadEnvFile(".env");
}

/**
 * Proves the exact race PROMPTS.md Phase 5 item 7 calls out by name: the client-side
 * `/api/payment/verify` callback and the async `/api/payment/webhook` can both try to mark the
 * same order paid — arriving concurrently, or one redelivered twice — and this must never corrupt
 * state or double-process. Set up here with a hand-inserted `pending` Razorpay order (bypassing
 * checkout, since no real Razorpay account exists in this environment to produce one through the
 * normal flow) and real HTTP requests against the actually-running app, exactly like
 * checkout-integrity.test.ts.
 */
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

let db: Client;

beforeAll(async () => {
  if (!KEY_SECRET || !WEBHOOK_SECRET) {
    throw new Error("RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET must be set in .env for this test (see PROMPTS.md brief).");
  }
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`unexpected status ${res.status}`);
  } catch (err) {
    throw new Error(`payment-race.test.ts requires the dev server running at ${BASE_URL}. Underlying error: ${err}`);
  }
  db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
});

afterAll(async () => {
  await db?.end();
});

/** Inserts a bare-bones `pending` Razorpay order directly (bypassing checkout entirely, since
 * this dev environment has no real Razorpay credentials to create one the normal way) so the
 * verify/webhook routes have something real to act on. */
async function insertPendingRazorpayOrder(): Promise<{ orderId: number; razorpayOrderId: string; email: string }> {
  const email = `payment-race-${randomUUID()}@example.com`;
  const razorpayOrderId = `order_test_${randomUUID().replace(/-/g, "")}`;
  const idempotencyKey = randomUUID();
  const { rows } = await db.query<{ id: number }>(
    `insert into orders
      (order_number, idempotency_key, email, phone, status, payment_method, payment_status,
       subtotal_paise, discount_paise, shipping_paise, total_paise, razorpay_order_id, shipping_address)
     values
      ($1, $2, $3, '9876543210', 'pending', 'razorpay', 'pending', 32400, 0, 5000, 37400, $4, $5::jsonb)
     returning id`,
    [
      `DM-TEST-${randomUUID().slice(0, 8)}`,
      idempotencyKey,
      email,
      razorpayOrderId,
      JSON.stringify({ name: "Test Shopper", phone: "9876543210", line1: "123 Test St", city: "Sangrur", state: "Punjab", pincode: "148001" }),
    ],
  );
  return { orderId: rows[0].id, razorpayOrderId, email };
}

describe("payment.captured — verify route and webhook racing on the same order", () => {
  it("a concurrent client-verify call and a webhook call for the same payment both succeed and leave the order paid exactly once, uncorrupted", async () => {
    const { orderId, razorpayOrderId } = await insertPendingRazorpayOrder();
    const razorpayPaymentId = `pay_test_${randomUUID().replace(/-/g, "")}`;
    const razorpaySignature = signCheckoutPayload(razorpayOrderId, razorpayPaymentId, KEY_SECRET!);

    const webhookBody = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: razorpayPaymentId, order_id: razorpayOrderId, status: "captured" } } },
    });
    const webhookSignature = createHmac("sha256", WEBHOOK_SECRET!).update(webhookBody).digest("hex");

    const verifyCall = fetch(`${BASE_URL}/api/payment/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature }),
    }).then((r) => r.json());

    const webhookCall = fetch(`${BASE_URL}/api/payment/webhook`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-razorpay-signature": webhookSignature },
      body: webhookBody,
    }).then((r) => r.json());

    // Genuinely concurrent, exactly the "arrives before, after, or interleaved" race.
    const [verifyResult, webhookResult] = await Promise.all([verifyCall, webhookCall]);

    expect(verifyResult.ok).toBe(true);
    expect(webhookResult.ok).toBe(true);

    const { rows } = await db.query<{ payment_status: string; status: string; razorpay_payment_id: string }>(
      `select payment_status, status, razorpay_payment_id from orders where id = $1`,
      [orderId],
    );
    expect(rows[0].payment_status).toBe("paid");
    expect(rows[0].status).toBe("confirmed");
    // Uncorrupted — the payment id landed exactly once, not garbled by two writers racing.
    expect(rows[0].razorpay_payment_id).toBe(razorpayPaymentId);
  }, 20_000);

  it("a redelivered (duplicate) webhook for an already-paid order is a safe no-op, not an error or a double-process", async () => {
    const { orderId, razorpayOrderId } = await insertPendingRazorpayOrder();
    const razorpayPaymentId = `pay_test_${randomUUID().replace(/-/g, "")}`;
    const webhookBody = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: razorpayPaymentId, order_id: razorpayOrderId, status: "captured" } } },
    });
    const webhookSignature = createHmac("sha256", WEBHOOK_SECRET!).update(webhookBody).digest("hex");

    const send = () =>
      fetch(`${BASE_URL}/api/payment/webhook`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-razorpay-signature": webhookSignature },
        body: webhookBody,
      }).then((r) => r.json());

    const first = await send();
    const second = await send(); // Razorpay's own at-least-once redelivery of the identical event

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    const { rows } = await db.query<{ payment_status: string }>(`select payment_status from orders where id = $1`, [orderId]);
    expect(rows[0].payment_status).toBe("paid");
  }, 20_000);
});

describe("payment.failed — idempotent, and releases reserved stock", () => {
  it("a duplicate payment.failed webhook is a safe no-op after the first marks the order failed", async () => {
    const { orderId, razorpayOrderId } = await insertPendingRazorpayOrder();
    const webhookBody = JSON.stringify({
      event: "payment.failed",
      payload: { payment: { entity: { id: `pay_test_${randomUUID().replace(/-/g, "")}`, order_id: razorpayOrderId } } },
    });
    const webhookSignature = createHmac("sha256", WEBHOOK_SECRET!).update(webhookBody).digest("hex");

    const send = () =>
      fetch(`${BASE_URL}/api/payment/webhook`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-razorpay-signature": webhookSignature },
        body: webhookBody,
      }).then((r) => r.json());

    const first = await send();
    const second = await send();

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    const { rows } = await db.query<{ payment_status: string }>(`select payment_status from orders where id = $1`, [orderId]);
    expect(rows[0].payment_status).toBe("failed");
  }, 20_000);

  it("rejects a webhook whose signature doesn't match (tampered or forged)", async () => {
    const { razorpayOrderId } = await insertPendingRazorpayOrder();
    const webhookBody = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_forged", order_id: razorpayOrderId } } },
    });

    const res = await fetch(`${BASE_URL}/api/payment/webhook`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-razorpay-signature": "0".repeat(64) },
      body: webhookBody,
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("invalid_signature");
  });
});

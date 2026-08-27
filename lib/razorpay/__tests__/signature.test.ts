import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { signCheckoutPayload, verifyCheckoutSignature, verifyWebhookSignature } from "../signature";

const KEY_SECRET = "test-checkout-secret-do-not-use-in-prod";
const WEBHOOK_SECRET = "test-webhook-secret-do-not-use-in-prod";

describe("verifyCheckoutSignature — HMAC-SHA256(order_id|payment_id, RAZORPAY_KEY_SECRET)", () => {
  const orderId = "order_Lm4X9pQr2K";
  const paymentId = "pay_Nb8Y2wRz7T";

  it("accepts a valid signature computed the same way Razorpay's checkout would", () => {
    const validSignature = signCheckoutPayload(orderId, paymentId, KEY_SECRET);
    expect(verifyCheckoutSignature(orderId, paymentId, validSignature, KEY_SECRET)).toBe(true);
  });

  it("rejects a tampered signature (one hex character flipped)", () => {
    const validSignature = signCheckoutPayload(orderId, paymentId, KEY_SECRET);
    const tampered = validSignature.slice(0, -1) + (validSignature.at(-1) === "0" ? "1" : "0");
    expect(verifyCheckoutSignature(orderId, paymentId, tampered, KEY_SECRET)).toBe(false);
  });

  it("rejects a signature computed against a different payment id (an attacker claiming someone else's payment)", () => {
    const validSignature = signCheckoutPayload(orderId, "pay_SOMEONE_ELSES", KEY_SECRET);
    expect(verifyCheckoutSignature(orderId, paymentId, validSignature, KEY_SECRET)).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifyCheckoutSignature(orderId, paymentId, null, KEY_SECRET)).toBe(false);
    expect(verifyCheckoutSignature(orderId, paymentId, undefined, KEY_SECRET)).toBe(false);
    expect(verifyCheckoutSignature(orderId, paymentId, "", KEY_SECRET)).toBe(false);
  });

  it("rejects a signature signed with the wrong secret", () => {
    const wrongSecretSignature = signCheckoutPayload(orderId, paymentId, "some-other-secret");
    expect(verifyCheckoutSignature(orderId, paymentId, wrongSecretSignature, KEY_SECRET)).toBe(false);
  });

  it("never throws on a malformed (non-hex) signature", () => {
    expect(() => verifyCheckoutSignature(orderId, paymentId, "not-hex-at-all!!", KEY_SECRET)).not.toThrow();
    expect(verifyCheckoutSignature(orderId, paymentId, "not-hex-at-all!!", KEY_SECRET)).toBe(false);
  });
});

describe("verifyWebhookSignature — HMAC-SHA256(raw body, RAZORPAY_WEBHOOK_SECRET)", () => {
  const rawBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_abc123" } } } });

  it("accepts a valid webhook signature", () => {
    const valid = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
    expect(verifyWebhookSignature(rawBody, valid, WEBHOOK_SECRET)).toBe(true);
  });

  it("rejects a tampered payload (body changed after signing)", () => {
    const validForOriginal = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
    const tamperedBody = rawBody.replace("payment.captured", "payment.failed");
    expect(verifyWebhookSignature(tamperedBody, validForOriginal, WEBHOOK_SECRET)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyWebhookSignature(rawBody, null, WEBHOOK_SECRET)).toBe(false);
    expect(verifyWebhookSignature(rawBody, undefined, WEBHOOK_SECRET)).toBe(false);
  });

  it("uses the webhook secret, not the checkout key secret — the two are not interchangeable", () => {
    const signedWithCheckoutSecret = createHmac("sha256", KEY_SECRET).update(rawBody).digest("hex");
    expect(verifyWebhookSignature(rawBody, signedWithCheckoutSecret, WEBHOOK_SECRET)).toBe(false);
  });
});

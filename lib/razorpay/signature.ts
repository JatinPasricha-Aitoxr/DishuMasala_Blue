/**
 * Razorpay's two HMAC-SHA256 signature schemes (CLAUDE.md §7.5). Pure Node crypto against a
 * shared secret — no network access needed, so unlike order creation this needs no mock boundary:
 * it can and does run for real in dev with a real `RAZORPAY_KEY_SECRET`/`RAZORPAY_WEBHOOK_SECRET`
 * value in `.env`, and is unit-tested directly with valid/tampered/missing signatures.
 *
 * No "server-only" import here on purpose — that guard is about keeping secrets and DB access out
 * of client bundles, not about test-only code; these functions never touch process.env
 * themselves (the caller passes the secret in), so they're just as safe to import from a Vitest
 * file as from a route handler.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function hmacHex(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Timing-safe hex-string comparison — false (never throws) on any malformed input, including
 * mismatched lengths, which `crypto.timingSafeEqual` itself would throw on. */
function safeHexEqual(expectedHex: string, givenHex: string | null | undefined): boolean {
  if (!givenHex) return false;
  let expectedBuf: Buffer;
  let givenBuf: Buffer;
  try {
    expectedBuf = Buffer.from(expectedHex, "hex");
    givenBuf = Buffer.from(givenHex, "hex");
  } catch {
    return false;
  }
  if (expectedBuf.length !== givenBuf.length || expectedBuf.length === 0) return false;
  return timingSafeEqual(expectedBuf, givenBuf);
}

/** The checkout-callback signature: HMAC-SHA256(`${orderId}|${paymentId}`, RAZORPAY_KEY_SECRET). */
export function signCheckoutPayload(razorpayOrderId: string, razorpayPaymentId: string, keySecret: string): string {
  return hmacHex(`${razorpayOrderId}|${razorpayPaymentId}`, keySecret);
}

/** Verifies the signature Razorpay's client-side checkout hands back after payment, per
 * CLAUDE.md §7.5, with a timing-safe compare (never `===` on the raw hex strings). */
export function verifyCheckoutSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string | null | undefined,
  keySecret: string,
): boolean {
  return safeHexEqual(signCheckoutPayload(razorpayOrderId, razorpayPaymentId, keySecret), signature);
}

/** Webhook payloads are signed differently — HMAC-SHA256 of the *raw request body* against the
 * separate `RAZORPAY_WEBHOOK_SECRET` (a distinct secret from the checkout key), per Razorpay's
 * webhook docs. Must be computed against the exact raw bytes, before any JSON parsing. */
export function verifyWebhookSignature(rawBody: string, signature: string | null | undefined, webhookSecret: string): boolean {
  return safeHexEqual(hmacHex(rawBody, webhookSecret), signature);
}

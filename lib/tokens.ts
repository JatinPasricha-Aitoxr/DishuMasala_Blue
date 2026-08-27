import "server-only";

/**
 * Generic signed, expiring token — the same shape lib/order-token.ts introduced in Phase 5 for
 * guest order confirmation links, generalised here (PROMPTS.md Phase 6: "reuse or generalize the
 * existing signing/verification helper ... unless it's genuinely not reusable") so email
 * verification and password reset use one real implementation instead of a second one from
 * scratch. lib/order-token.ts itself is left as-is (its own narrower HMAC(orderNumber|email)
 * shape has no expiry and no payload, and app/order/[orderNumber]/page.tsx already depends on its
 * exact string format) but shares the same primitive: HMAC-SHA256 with AUTH_SECRET, timing-safe
 * compare.
 *
 * A token here is `base64url(JSON.stringify(payload)) + "." + hex(HMAC-SHA256(that string))`.
 * The payload always carries `purpose` (so a verify-email token can never be replayed as a
 * password-reset token) and `exp` (a Unix-ms expiry). Verification checks the signature first,
 * then decodes and checks purpose + expiry — an attacker who can't forge the signature never
 * gets far enough to see a parsed payload from a tampered token.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set — required to sign/verify tokens.");
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("hex");
}

export interface TokenPayload {
  purpose: string;
  exp: number;
  [key: string]: unknown;
}

export function signPayloadToken(purpose: string, payload: Record<string, unknown>, ttlMs: number): string {
  const body: TokenPayload = { ...payload, purpose, exp: Date.now() + ttlMs };
  const encoded = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

/** Returns the parsed payload only when the signature is valid, the purpose matches, and the
 * token hasn't expired. Any failure (malformed, tampered, wrong purpose, expired) returns null —
 * callers must never distinguish these cases in a user-facing message (no enumeration). `T` is
 * the caller's own extra-fields shape (e.g. `{ userId: number; email: string }`); the returned
 * value always also carries `purpose`/`exp` from `TokenPayload`. */
export function verifyPayloadToken<T extends Record<string, unknown>>(
  purpose: string,
  token: string | null | undefined,
): (T & TokenPayload) | null {
  if (!token) return null;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex <= 0) return null;
  const encoded = token.slice(0, dotIndex);
  const givenSignature = token.slice(dotIndex + 1);

  const expectedSignature = sign(encoded);
  let expectedBuf: Buffer;
  let givenBuf: Buffer;
  try {
    expectedBuf = Buffer.from(expectedSignature, "hex");
    givenBuf = Buffer.from(givenSignature, "hex");
  } catch {
    return null;
  }
  if (expectedBuf.length !== givenBuf.length || !timingSafeEqual(expectedBuf, givenBuf)) return null;

  let payload: T & TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T & TokenPayload;
  } catch {
    return null;
  }
  if (payload.purpose !== purpose) return null;
  if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  return payload;
}

import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db/queries/users";
import { signPayloadToken } from "@/lib/tokens";
import { createHash } from "node:crypto";

/**
 * Test-only control surface (same pattern as app/api/testing/razorpay-mock/route.ts) for
 * Playwright's register→verify→login→logout→reset E2E run. There's no real Resend account in
 * this environment, so lib/email.ts#sendVerifyEmail/#sendResetPasswordEmail only ever log a
 * would-be send — a real inbox has nothing to check. This route mints the exact same signed
 * tokens those emails would have linked to (same lib/tokens.ts helpers, same purpose/ttl/payload
 * shape used by lib/actions/auth.ts), so a test can complete the flow deterministically without
 * needing a mail provider. It never reveals anything a real "forgot password" email wouldn't
 * already hand the account owner, and — like the Razorpay mock — 404s whenever NODE_ENV is
 * "production", so `next build && next start` makes it structurally unreachable regardless of any
 * other config.
 */
function blockedInProduction(): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "not_available" }, { status: 404 });
  }
  return null;
}

function pwdFingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

export async function POST(req: Request): Promise<NextResponse> {
  const blocked = blockedInProduction();
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as { email?: string };
  if (!body.email) return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });

  const user = await getUserByEmail(body.email);
  if (!user) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const verifyToken = signPayloadToken("email-verify", { userId: user.id, email: user.email }, 24 * 60 * 60 * 1000);
  const resetToken = signPayloadToken(
    "password-reset",
    { userId: user.id, email: user.email, fp: pwdFingerprint(user.passwordHash) },
    30 * 60 * 1000,
  );

  return NextResponse.json({ ok: true, verifyToken, resetToken });
}

"use server";

/**
 * Register / verify / reset server actions (CLAUDE.md §2 / PROMPTS.md Phase 6 item 1). Login
 * itself lives in auth.ts's Credentials `authorize` (invoked via next-auth's own `signIn`), not
 * here — these are the flows around it.
 *
 * No-enumeration discipline: `registerAction` and `requestPasswordResetAction` both return the
 * exact same generic message whether or not the email is already registered / exists, and both
 * do a real-shaped amount of work either way (see each function's comment) so a fast/slow
 * response difference can't be used as an oracle either.
 */
import { headers } from "next/headers";
import { z } from "zod";
import { createUser, markEmailVerified, updatePasswordHash } from "@/lib/db/mutations/users";
import { getUserByEmail, getUserById } from "@/lib/db/queries/users";
import { hashPassword, burnPasswordVerifyTime } from "@/lib/auth/password";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { signPayloadToken, verifyPayloadToken } from "@/lib/tokens";
import { sendVerifyEmail, sendResetPasswordEmail } from "@/lib/email";
import { getSessionUser } from "@/lib/auth/session";
import { createHash } from "node:crypto";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function requestIp(): Promise<string | null> {
  const h = await headers();
  return clientIpFromHeaders(h);
}

function pwdFingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

// ---- Register -----------------------------------------------------------------------------

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterResult = { ok: true } | { ok: false; error: string; rateLimited?: boolean };

export async function registerAction(input: RegisterInput): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };

  const ip = await requestIp();
  const { allowed } = await checkRateLimit("register", { ip, email: parsed.data.email });
  if (!allowed) return { ok: false, error: "Too many attempts. Please try again later.", rateLimited: true };

  const result = await createUser({
    email: parsed.data.email,
    name: parsed.data.name,
    phone: parsed.data.phone,
    password: parsed.data.password,
  });

  if (!result.ok) {
    // Email already taken — never say so. Burn a comparable amount of time (register's real path
    // just did a real Argon2 hash; the "taken" path does its own here) and return the identical
    // generic message.
    await burnPasswordVerifyTime();
    return { ok: true }; // same success shape as a real registration — no enumeration
  }

  const user = await getUserByEmail(parsed.data.email);
  if (user) {
    const token = signPayloadToken("email-verify", { userId: user.id, email: user.email }, 24 * 60 * 60 * 1000);
    const verifyUrl = `${siteUrl()}/verify-email?token=${encodeURIComponent(token)}`;
    await sendVerifyEmail(user.email, user.name, verifyUrl);
  }

  return { ok: true };
}

// ---- Email verification --------------------------------------------------------------------

type EmailVerifyPayload = {
  userId: number;
  email: string;
};

export type VerifyEmailResult = { ok: true } | { ok: false };

/** Called from app/verify-email/page.tsx. Idempotent — verifying an already-verified account is
 * a harmless no-op success, not an error. */
export async function verifyEmailAction(token: string): Promise<VerifyEmailResult> {
  const payload = verifyPayloadToken<EmailVerifyPayload>("email-verify", token);
  if (!payload) return { ok: false };
  const user = await getUserByEmail(payload.email);
  if (!user || user.id !== payload.userId) return { ok: false };
  await markEmailVerified(user.id);
  return { ok: true };
}

export type ResendVerificationResult = { ok: true };

/** Always returns ok:true (no enumeration) — requires being signed in as the account itself, so
 * there's no cross-account risk to worry about here at all. */
export async function resendVerificationAction(): Promise<ResendVerificationResult> {
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    const user = await getUserById(sessionUser.id);
    if (user && !user.emailVerifiedAt) {
      const token = signPayloadToken("email-verify", { userId: user.id, email: user.email }, 24 * 60 * 60 * 1000);
      const verifyUrl = `${siteUrl()}/verify-email?token=${encodeURIComponent(token)}`;
      await sendVerifyEmail(user.email, user.name, verifyUrl);
    }
  }
  return { ok: true };
}

// ---- Password reset -------------------------------------------------------------------------

const requestResetSchema = z.object({ email: z.string().trim().email().max(200) });

export type RequestResetResult = { ok: true; message: string };

const GENERIC_RESET_MESSAGE = "If an account exists for that email, we've sent a password reset link.";

export async function requestPasswordResetAction(input: { email: string }): Promise<RequestResetResult> {
  const parsed = requestResetSchema.safeParse(input);
  if (!parsed.success) return { ok: true, message: GENERIC_RESET_MESSAGE };

  const ip = await requestIp();
  const { allowed } = await checkRateLimit("reset_request", { ip, email: parsed.data.email });
  if (!allowed) return { ok: true, message: GENERIC_RESET_MESSAGE };

  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    await burnPasswordVerifyTime();
    return { ok: true, message: GENERIC_RESET_MESSAGE };
  }

  const token = signPayloadToken(
    "password-reset",
    { userId: user.id, email: user.email, fp: pwdFingerprint(user.passwordHash) },
    30 * 60 * 1000,
  );
  const resetUrl = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendResetPasswordEmail(user.email, user.name, resetUrl);

  return { ok: true, message: GENERIC_RESET_MESSAGE };
}

type ResetPayload = {
  userId: number;
  email: string;
  fp: string;
};

const confirmResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "Use at least 8 characters").max(200),
});

export type ConfirmResetResult = { ok: true } | { ok: false; error: string };

/**
 * The token embeds a fingerprint of the password hash it was issued against (`fp`), so once this
 * function changes the password, the exact same token becomes invalid on any replay — real
 * single-use, with no separate "used tokens" table needed (lib/tokens.ts's doc comment explains
 * the trick). Rate-limited by IP alone (no email at this point — the email is inside the signed
 * token, not user input, so there's nothing to rate-limit it against without first trusting an
 * unverified token).
 */
export async function resetPasswordAction(input: { token: string; newPassword: string }): Promise<ConfirmResetResult> {
  const parsed = confirmResetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };

  const ip = await requestIp();
  const { allowed } = await checkRateLimit("reset_confirm", { ip });
  if (!allowed) return { ok: false, error: "Too many attempts. Please try again later." };

  const payload = verifyPayloadToken<ResetPayload>("password-reset", parsed.data.token);
  if (!payload) return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };

  const user = await getUserByEmail(payload.email);
  if (!user || user.id !== payload.userId || pwdFingerprint(user.passwordHash) !== payload.fp) {
    return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await updatePasswordHash(user.id, newHash);
  return { ok: true };
}

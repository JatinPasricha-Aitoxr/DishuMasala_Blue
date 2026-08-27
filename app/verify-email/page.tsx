import Link from "next/link";
import { verifyEmailAction } from "@/lib/actions/auth";

export const metadata = { title: "Verify email — Dishu Masala", robots: { index: false, follow: false } };

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Verifies the signed token from the email lib/email.ts#sendVerifyEmail sent (PROMPTS.md Phase 6
 * item 1). A Server Component performing the mutation directly on render is fine here — the
 * action itself is idempotent (verifying twice is a harmless no-op) and there's no user input
 * beyond the URL token, so there's no double-submit risk a client form would otherwise guard
 * against.
 */
export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { ok: false as const };

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center sm:px-6">
      {result.ok ? (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Email verified</h1>
          <p className="mt-2 text-sm text-ink-2">Your email address is confirmed. You can now sign in.</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Link invalid or expired</h1>
          <p className="mt-2 text-sm text-ink-2">
            This verification link is no longer valid. Sign in and request a new one from your account.
          </p>
        </>
      )}
      <Link href="/login" className="mt-6 inline-block text-sm font-medium text-ink underline underline-offset-4">
        Go to sign in
      </Link>
    </div>
  );
}

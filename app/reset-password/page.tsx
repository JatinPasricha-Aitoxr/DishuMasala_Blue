"use client";

/**
 * Password reset, both halves (PROMPTS.md Phase 6 item 1): request (no `token` in the URL) and
 * confirm (`?token=...`, from the email lib/email.ts#sendResetPasswordEmail sent). One page
 * rather than two so the email's link and the "forgot password" link both land somewhere sensible
 * without duplicating the shell.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestPasswordResetAction, resetPasswordAction } from "@/lib/actions/auth";

const requestSchema = z.object({ email: z.string().trim().email("Enter a valid email") });
type RequestValues = z.infer<typeof requestSchema>;

const confirmSchema = z
  .object({
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });
type ConfirmValues = z.infer<typeof confirmSchema>;

function RequestForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestValues>({ resolver: zodResolver(requestSchema) });

  const onSubmit = async (values: RequestValues) => {
    setSubmitting(true);
    const result = await requestPasswordResetAction(values);
    setSubmitting(false);
    setMessage(result.message);
  };

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-2">Enter your account email and we&apos;ll send a reset link.</p>

      {message ? (
        <p className="mt-6 rounded-md bg-surface-2 px-3.5 py-2.5 text-sm text-ink">{message}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              Email
            </label>
            <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
            {errors.email && <p className="mt-1 text-sm text-crit">{errors.email.message}</p>}
          </div>
          <Button type="submit" loading={submitting}>
            Send reset link
          </Button>
        </form>
      )}
    </>
  );
}

function ConfirmForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmValues>({ resolver: zodResolver(confirmSchema) });

  const onSubmit = async (values: ConfirmValues) => {
    setSubmitting(true);
    setError(null);
    const result = await resetPasswordAction({ token, newPassword: values.newPassword });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/login?reset=1");
  };

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-ink">Choose a new password</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-ink">
            New password
          </label>
          <Input id="newPassword" type="password" autoComplete="new-password" invalid={!!errors.newPassword} {...register("newPassword")} />
          {errors.newPassword && <p className="mt-1 text-sm text-crit">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-ink">
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-crit">{errors.confirmPassword.message}</p>}
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-crit/10 px-3.5 py-2.5 text-sm text-crit">
            {error}
          </p>
        )}
        <Button type="submit" loading={submitting}>
          Reset password
        </Button>
      </form>
    </>
  );
}

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      {token ? <ConfirmForm token={token} /> : <RequestForm />}
      <p className="mt-6 text-sm text-ink-2">
        <Link href="/login" className="font-medium text-ink underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

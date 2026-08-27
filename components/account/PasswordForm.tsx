"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { changePasswordAction } from "@/lib/actions/profile";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });
type Values = z.infer<typeof schema>;

/** Re-verifies the current password server-side before accepting a new one (PROMPTS.md Phase 6
 * item 3) — lib/actions/profile.ts#changePasswordAction does the real check; this form just
 * surfaces its result. */
export function PasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    const result = await changePasswordAction(values);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-ink">
          Current password
        </label>
        <Input id="currentPassword" type="password" autoComplete="current-password" invalid={!!errors.currentPassword} {...register("currentPassword")} />
        {errors.currentPassword && <p className="mt-1 text-sm text-crit">{errors.currentPassword.message}</p>}
      </div>
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
        <Input id="confirmPassword" type="password" autoComplete="new-password" invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="mt-1 text-sm text-crit">{errors.confirmPassword.message}</p>}
      </div>
      {error && <p className="text-sm text-crit">{error}</p>}
      {success && <p className="text-sm text-ok">Password updated.</p>}
      <Button type="submit" size="sm" className="w-fit" loading={submitting}>
        Update password
      </Button>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProfileAction } from "@/lib/actions/profile";
import { resendVerificationAction } from "@/lib/actions/auth";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
});
type Values = z.infer<typeof schema>;

export function ProfileForm({ initialName, initialPhone, email }: { initialName: string; initialPhone: string | null; email: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resent, setResent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: initialName, phone: initialPhone ?? "" } });

  const onSubmit = async (values: Values) => {
    setSubmitting(true);
    setError(null);
    setSaved(false);
    const result = await updateProfileAction({ name: values.name, phone: values.phone || null });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <Input id="profile-email" value={email} disabled readOnly />
        <button
          type="button"
          className="mt-1 text-xs font-medium text-ink-2 underline underline-offset-4 hover:text-ink disabled:opacity-50"
          disabled={resent}
          onClick={async () => {
            await resendVerificationAction();
            setResent(true);
          }}
        >
          {resent ? "Verification email sent" : "Resend verification email"}
        </button>
      </div>
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
          Name
        </label>
        <Input id="name" invalid={!!errors.name} {...register("name")} />
        {errors.name && <p className="mt-1 text-sm text-crit">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
          Phone
        </label>
        <Input id="phone" invalid={!!errors.phone} {...register("phone")} />
        {errors.phone && <p className="mt-1 text-sm text-crit">{errors.phone.message}</p>}
      </div>
      {error && <p className="text-sm text-crit">{error}</p>}
      {saved && <p className="text-sm text-ok">Saved.</p>}
      <Button type="submit" size="sm" className="w-fit" loading={submitting}>
        Save
      </Button>
    </form>
  );
}

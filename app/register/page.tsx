"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registerAction } from "@/lib/actions/auth";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "Use at least 8 characters"),
});
type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterValues) => {
    setSubmitting(true);
    setError(null);
    const result = await registerAction({ ...values, phone: values.phone || "" });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/login?registered=1");
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Create an account</h1>
      <p className="mt-1 text-sm text-ink-2">Track orders, save addresses, and build a wishlist.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
            Name
          </label>
          <Input id="name" autoComplete="name" invalid={!!errors.name} {...register("name")} />
          {errors.name && <p className="mt-1 text-sm text-crit">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="mt-1 text-sm text-crit">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
            Phone <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <Input id="phone" type="tel" autoComplete="tel" invalid={!!errors.phone} {...register("phone")} />
          {errors.phone && <p className="mt-1 text-sm text-crit">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
            Password
          </label>
          <Input id="password" type="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
          {errors.password && <p className="mt-1 text-sm text-crit">{errors.password.message}</p>}
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-crit/10 px-3.5 py-2.5 text-sm text-crit">
            {error}
          </p>
        )}

        <Button type="submit" loading={submitting} className="mt-2">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-2">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}

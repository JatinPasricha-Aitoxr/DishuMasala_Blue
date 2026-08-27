"use client";

/**
 * Guest order lookup, second path (PROMPTS.md Phase 6 item 5) — order number + email. On a match,
 * lib/actions/guest-order.ts re-issues a fresh signed link (the same shape Phase 5's confirmation
 * email uses) and this page navigates straight there; app/order/[orderNumber]/page.tsx does its
 * own independent verification of that link, so this form is never itself a source of truth about
 * order contents.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { guestOrderLookupAction } from "@/lib/actions/guest-order";

const schema = z.object({
  orderNumber: z.string().trim().min(1, "Enter your order number"),
  email: z.string().trim().email("Enter a valid email"),
});
type Values = z.infer<typeof schema>;

export default function OrderLookupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    setSubmitting(true);
    setError(null);
    const result = await guestOrderLookupAction(values);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // The action returns an absolute site URL; go there directly (a new page render performs its
    // own independent token verification, this form does not).
    router.push(result.url.replace(/^https?:\/\/[^/]+/, ""));
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Find your order</h1>
      <p className="mt-1 text-sm text-ink-2">Enter your order number and the email you used at checkout.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="orderNumber" className="mb-1.5 block text-sm font-medium text-ink">
            Order number
          </label>
          <Input id="orderNumber" placeholder="DM-2026-00001" invalid={!!errors.orderNumber} {...register("orderNumber")} />
          {errors.orderNumber && <p className="mt-1 text-sm text-crit">{errors.orderNumber.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <Input id="email" type="email" invalid={!!errors.email} {...register("email")} />
          {errors.email && <p className="mt-1 text-sm text-crit">{errors.email.message}</p>}
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-crit/10 px-3.5 py-2.5 text-sm text-crit">
            {error}
          </p>
        )}
        <Button type="submit" loading={submitting}>
          Find order
        </Button>
      </form>
    </div>
  );
}

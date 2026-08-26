"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  email: z.email("Enter a valid email address"),
});
type FormValues = z.infer<typeof schema>;

/** Client-side validation only — there is no submission endpoint yet (that's a later phase; the
 * `newsletter_subs` table already exists in the schema for when there is one). Submitting a valid
 * address just shows a local confirmation state; nothing is sent anywhere. */
export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async () => {
    await new Promise((r) => setTimeout(r, 250));
    setSubmitted(true);
    reset();
  });

  if (submitted) {
    return (
      <p role="status" className="text-sm font-medium text-ink">
        Thanks — you&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
      <label htmlFor="newsletter-email" className="text-sm font-semibold text-ink">
        Get brew guides and launch news
      </label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id="newsletter-email"
            type="email"
            placeholder="you@example.com"
            invalid={!!errors.email}
            aria-describedby={errors.email ? "newsletter-email-error" : undefined}
            {...register("email")}
          />
        </div>
        <Button type="submit" variant="solid-ink" loading={isSubmitting}>
          Subscribe
        </Button>
      </div>
      {errors.email && (
        <p id="newsletter-email-error" role="alert" className="text-xs text-crit">
          {errors.email.message}
        </p>
      )}
    </form>
  );
}

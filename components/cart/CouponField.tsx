"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCartStore } from "@/lib/store/cart";

/** The coupon-code field (PROMPTS.md Phase 5 item 2/4). Submits a code to be validated server-side
 * via the cart store's `applyCoupon` → `/api/cart/validate` — this component never computes or
 * displays a discount itself, only what the server confirms (CLAUDE.md §7.5). */
export function CouponField() {
  const couponCode = useCartStore((s) => s.couponCode);
  const pricing = useCartStore((s) => s.pricing);
  const isValidating = useCartStore((s) => s.isValidating);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const [value, setValue] = useState("");
  const inputId = useId();

  const applied = couponCode != null && pricing?.couponCode === couponCode;

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3.5 py-2.5 text-sm">
        <span className="font-medium text-ink">
          Coupon <span className="tabular-nums">{couponCode}</span> applied
        </span>
        <button type="button" onClick={removeCoupon} className="text-xs font-medium text-ink-2 underline underline-offset-4 hover:text-crit">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) void applyCoupon(value);
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Coupon code
      </label>
      <Input
        id={inputId}
        name="coupon"
        placeholder="Coupon code"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" variant="outline" size="md" loading={isValidating} disabled={!value.trim()}>
        Apply
      </Button>
    </form>
  );
}

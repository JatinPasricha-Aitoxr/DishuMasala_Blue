"use client";

import Link from "next/link";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { CartLineItem } from "./CartLineItem";
import { CartNotices } from "./CartNotices";
import { EmptyCart } from "./EmptyCart";
import { FreeShippingProgress } from "./FreeShippingProgress";
import { CouponField } from "./CouponField";
import { OrderSummary } from "./OrderSummary";
import { useCartStore, selectFreeShippingThresholdPaise, selectRupeesToFreeShippingPaise, selectSubtotalPaise } from "@/lib/store/cart";

/** The slide-in cart (PROMPTS.md Phase 5 item 2). Fully keyboard-operable via the underlying Radix
 * Dialog (Drawer): focus trapped inside, Escape closes, focus returns to whatever opened it. */
export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const open = useCartStore((s) => s.open);
  const close = useCartStore((s) => s.close);
  const lines = useCartStore((s) => s.lines);
  const pricing = useCartStore((s) => s.pricing);
  const subtotalPaise = useCartStore(selectSubtotalPaise);
  const thresholdPaise = useCartStore(selectFreeShippingThresholdPaise);
  const rupeesToGoPaise = useCartStore(selectRupeesToFreeShippingPaise);

  return (
    <Drawer open={isOpen} onOpenChange={(next) => (next ? open() : close())}>
      <DrawerContent side="right" className="flex flex-col gap-4">
        <VisuallyHidden>
          <DrawerTitle>Your cart</DrawerTitle>
          <DrawerDescription>Review items, apply a coupon and check out.</DrawerDescription>
        </VisuallyHidden>
        <h2 className="font-display text-lg font-semibold text-ink">Your cart ({lines.reduce((n, l) => n + l.qty, 0)})</h2>

        <CartNotices />

        {lines.length === 0 ? (
          <EmptyCart compact />
        ) : (
          <>
            {thresholdPaise != null && rupeesToGoPaise != null && (
              <FreeShippingProgress subtotalPaise={subtotalPaise} thresholdPaise={thresholdPaise} rupeesToGoPaise={rupeesToGoPaise} />
            )}

            <ul className="flex-1 overflow-y-auto">
              {lines.map((line) => (
                <CartLineItem key={line.variantId} line={line} />
              ))}
            </ul>

            <CouponField />
            <OrderSummary pricing={pricing} />

            <Button asChild variant="gradient" size="lg" onClick={close}>
              <Link href="/checkout/">Checkout</Link>
            </Button>
            <Link href="/cart/" onClick={close} className="text-center text-sm font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
              View full cart
            </Link>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

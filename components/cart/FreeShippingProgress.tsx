import { formatINR, paise } from "@/lib/money";

/**
 * The free-shipping progress bar (CLAUDE.md §5.4: one of the few surfaces the Lemon Shift gradient
 * is allowed on). Every number here comes from the caller's last server response
 * (lib/commerce/pricing.ts via lib/store/cart.ts) — never a hardcoded ₹500.
 */
export function FreeShippingProgress({
  subtotalPaise,
  thresholdPaise,
  rupeesToGoPaise,
}: {
  subtotalPaise: number;
  thresholdPaise: number;
  rupeesToGoPaise: number;
}) {
  const pct = thresholdPaise > 0 ? Math.min(100, Math.round((subtotalPaise / thresholdPaise) * 100)) : 100;
  const reached = rupeesToGoPaise <= 0;

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-2" role="status">
        {reached ? "You've unlocked free shipping" : `Add ${formatINR(paise(rupeesToGoPaise))} more for free shipping`}
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%`, backgroundImage: "var(--gradient-lemon-shift)" }}
        />
      </div>
    </div>
  );
}

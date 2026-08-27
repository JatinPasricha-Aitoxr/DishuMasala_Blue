"use client";

import { Placeholder } from "@/components/media/Placeholder";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatINR, paise } from "@/lib/money";
import { useCartStore, type CartLine } from "@/lib/store/cart";

/** One cart line — image, name, option, quantity control, remove, line total (PROMPTS.md Phase 5
 * item 2). Real migrated product photography isn't wired up yet in this dev environment (Phase 0's
 * R2 migration needs real credentials this environment doesn't have), so every line uses the same
 * generic placeholder slot the rest of the storefront falls back to. */
export function CartLineItem({ line }: { line: CartLine }) {
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <li className="flex gap-4 border-b border-line py-4 last:border-0">
      <div className="w-20 shrink-0">
        <Placeholder slot="product-packshot-generic" className="rounded-sm" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink">{line.productName}</p>
            <p className="text-xs text-ink-2">{line.optionValue}</p>
          </div>
          <p className="tabular-nums text-sm font-semibold text-ink">{formatINR(paise(line.unitPricePaise * line.qty))}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <QuantityStepper
            value={line.qty}
            onChange={(qty) => void updateQty(line.variantId, qty)}
            aria-label={`Quantity for ${line.productName}, ${line.optionValue}`}
          />
          <button
            type="button"
            onClick={() => void removeItem(line.variantId)}
            className="text-xs font-medium text-ink-2 underline underline-offset-4 hover:text-crit"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

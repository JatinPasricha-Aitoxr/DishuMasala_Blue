"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PriceBlock } from "@/components/ui/PriceBlock";
import { removeFromWishlistAction } from "@/lib/actions/wishlist";
import { paise } from "@/lib/money";
import type { WishlistCard } from "@/lib/db/queries/wishlist";

export function WishlistGrid({ items }: { items: WishlistCard[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);

  const handleRemove = async (productId: number) => {
    setBusyId(productId);
    await removeFromWishlistAction(productId);
    setBusyId(null);
    router.refresh();
  };

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.productId} className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
          <Link href={`/product/${item.slug}/`} className="block aspect-square bg-surface-2" />
          <div className="flex flex-1 flex-col gap-2 p-3">
            <Link href={`/product/${item.slug}/`} className="text-sm font-semibold text-ink hover:underline">
              {item.name}
            </Link>
            <PriceBlock mrpPaise={paise(item.mrpFromPaise)} pricePaise={paise(item.priceFromPaise)} />
            {!item.inStock && <p className="text-xs font-medium text-crit">Out of stock</p>}
            <Button variant="outline" size="sm" className="mt-auto" disabled={busyId === item.productId} onClick={() => handleRemove(item.productId)}>
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

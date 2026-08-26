"use client";

import { useState } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/Drawer";
import { ShopFilterForm } from "./ShopFilterForm";
import { AutoSubmitOnChange } from "./AutoSubmitOnChange";
import type { ShopFilters } from "@/lib/db/queries/shop-query";
import type { ShopFacets } from "@/lib/db/queries/shop";

export interface FilterSheetProps {
  filters: ShopFilters;
  facets: ShopFacets;
  action: string;
  /** How many filters are currently active, shown as a badge on the trigger. */
  activeCount: number;
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-4" aria-hidden="true">
      <path
        d="M2 4h12M4.5 8h7M7 12h2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Mobile filter drawer (Phase 1's `Drawer` primitive, Radix Dialog under the hood). This surface
 * genuinely needs JavaScript to open — a Dialog's expanded/collapsed state is React state, no way
 * around that — so on a no-JS mobile viewport this trigger is inert; `FilterRail` (desktop,
 * always-rendered, never dialog-gated) is what stays reachable without JS. That's a real, narrow
 * trade-off (documented, not silently assumed) rather than every filter surface degrading.
 */
export function FilterSheet({ filters, facets, action, activeCount }: FilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger className="flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink lg:hidden">
        <FilterIcon />
        Filters
        {activeCount > 0 && (
          <span className="tabular-nums flex size-5 items-center justify-center rounded-full bg-ink text-xs text-surface">
            {activeCount}
          </span>
        )}
      </DrawerTrigger>
      <DrawerContent side="left" aria-describedby={undefined}>
        <DrawerTitle className="mb-6 font-display text-lg font-semibold text-ink">Filter products</DrawerTitle>
        <ShopFilterForm formId="shop-filters-mobile" filters={filters} facets={facets} action={action} />
        <AutoSubmitOnChange formId="shop-filters-mobile" />
      </DrawerContent>
    </Drawer>
  );
}

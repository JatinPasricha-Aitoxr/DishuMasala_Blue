import Link from "next/link";
import { Input } from "@/components/ui/Input";
import type { ShopFilters } from "@/lib/db/queries/shop-query";
import type { ShopFacets } from "@/lib/db/queries/shop";

export interface ShopFilterFormProps {
  formId: string;
  filters: ShopFilters;
  facets: ShopFacets;
  action: string;
}

const RADIO_CLASS =
  "size-5 shrink-0 appearance-none rounded-full border border-line bg-surface " +
  "checked:border-[6px] checked:border-brew-2 transition-[border-width] duration-[180ms]";

/**
 * The real, server-rendered `<form method="GET">` behind both `FilterRail` (desktop) and
 * `FilterSheet` (mobile) — one shared implementation so the two surfaces can never drift out of
 * sync. Every control is a plain native input (radio/checkbox/number), never a Radix primitive:
 * Radix's Checkbox/RadioGroup render as `<button role="...">` elements with no native form
 * semantics of their own, so with JavaScript disabled they don't participate in a GET submission
 * at all — a native `<input>` does, for free, which is what the acceptance criterion ("filtering
 * still works with JavaScript disabled — real `<form method="GET">` submission") is actually
 * checking. Real `<fieldset>`/`<legend>` per category (CLAUDE.md §5.6 keyboard/screen-reader
 * floor) and live counts sourced from `getShopFacets` (never guessed) next to every option.
 */
export function ShopFilterForm({ formId, filters, facets, action }: ShopFilterFormProps) {
  const sortPreserved = filters.sort !== "priority" ? filters.sort : undefined;

  return (
    <form id={formId} method="GET" action={action} className="flex flex-col gap-7">
      {sortPreserved && <input type="hidden" name="sort" value={sortPreserved} />}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-ink">Collection</legend>
        <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-ink-2">
          <span className="flex items-center gap-2">
            <input
              type="radio"
              name="collection"
              value=""
              defaultChecked={!filters.collection}
              className={RADIO_CLASS}
            />
            All collections
          </span>
        </label>
        {facets.collections.map((c) => (
          <label key={c.slug} className="flex cursor-pointer items-center justify-between gap-2 text-sm text-ink-2">
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="collection"
                value={c.slug}
                defaultChecked={filters.collection === c.slug}
                className={RADIO_CLASS}
              />
              {c.title}
            </span>
            <span className="tabular-nums text-xs text-ink-3">{c.count}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-ink">Type</legend>
        <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-ink-2">
          <span className="flex items-center gap-2">
            <input type="radio" name="size" value="" defaultChecked={!filters.optionLabel} className={RADIO_CLASS} />
            All types
          </span>
        </label>
        {facets.optionLabels.map((o) => (
          <label
            key={o.optionLabel}
            className="flex cursor-pointer items-center justify-between gap-2 text-sm text-ink-2"
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="size"
                value={o.optionLabel}
                defaultChecked={filters.optionLabel === o.optionLabel}
                className={RADIO_CLASS}
              />
              {o.optionLabel}
            </span>
            <span className="tabular-nums text-xs text-ink-3">{o.count}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-ink">Price (₹)</legend>
        <div className="flex items-center gap-2">
          <label className="flex-1">
            <span className="sr-only">Minimum price in rupees</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              name="min"
              placeholder="Min"
              defaultValue={filters.priceMinRupees ?? ""}
            />
          </label>
          <span aria-hidden="true" className="text-ink-3">
            –
          </span>
          <label className="flex-1">
            <span className="sr-only">Maximum price in rupees</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              name="max"
              placeholder="Max"
              defaultValue={filters.priceMaxRupees ?? ""}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-ink">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-2">
          <input
            type="checkbox"
            name="stock"
            value="1"
            defaultChecked={filters.inStockOnly}
            className="size-5 shrink-0 appearance-none rounded-[4px] border border-line bg-surface checked:border-ink checked:bg-ink bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22%20fill=%22none%22%3E%3Cpath%20d=%22M3%208.5%206.2%2011.5%2013%204.5%22%20stroke=%22white%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E')] transition-colors duration-[180ms]"
          />
          In stock only
          <span className="tabular-nums text-xs text-ink-3">({facets.inStockCount})</span>
        </label>
      </fieldset>

      <div className="flex flex-col gap-2 border-t border-line pt-5">
        <button type="submit" className="h-11 rounded-md bg-ink text-sm font-semibold text-surface hover:opacity-90">
          Apply filters
        </button>
        <Link
          href={action}
          className="flex h-11 items-center justify-center rounded-md text-sm font-medium text-ink-2 hover:bg-surface-2"
        >
          Clear all
        </Link>
      </div>
    </form>
  );
}

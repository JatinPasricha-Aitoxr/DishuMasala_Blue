/**
 * The priority-then-price-descending comparator (CLAUDE.md §7.2 / §11: "the priority sort" is one
 * of the things Vitest must cover). Pure and DB-free — for ordering a small, already-fetched list
 * of items in memory (e.g. a homepage/related-products list, or a PDP's related-by-priority rail
 * in a later phase), never for `/shop` itself: the shop listing's actual ordering happens in SQL
 * via `lib/db/queries/shop-query.ts`'s `buildShopOrderBy`, built from the exact same three keys
 * (priority asc, primary-variant price desc, id asc) so the two can never drift apart.
 */
export interface PrioritySortable {
  id: number;
  priority: number;
  /** The product's representative (position-0) variant price, in paise. */
  primaryPricePaise: number;
}

/** `Array.prototype.sort` comparator: priority ascending, then price DESCENDING (the documented
 * tiebreak — CLAUDE.md §7.2, PROMPTS.md Phase 3), then id ascending as a final, stable tiebreak. */
export function compareByPriorityThenPriceDesc(a: PrioritySortable, b: PrioritySortable): number {
  if (a.priority !== b.priority) return a.priority - b.priority;
  if (a.primaryPricePaise !== b.primaryPricePaise) return b.primaryPricePaise - a.primaryPricePaise;
  return a.id - b.id;
}

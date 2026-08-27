/**
 * Pure helpers shared between Pagination.tsx ("use client") and PaginationLinks.tsx (a Server
 * Component, no "use client"). Deliberately its own file with NO "use client" directive: when
 * `pageWindow`/the class constants lived inside Pagination.tsx, importing them from
 * PaginationLinks.tsx made PaginationLinks a consumer of a Client Component module, and Next
 * treats every export of a "use client" file as a client reference — calling `pageWindow()`
 * directly (not rendering it as a component) from the server then throws at runtime: "Attempted
 * to call pageWindow() from the server but pageWindow is on the client."
 *
 * This was a latent bug from Phase 3 that never actually fired there: /shop only ever has ≤1 page
 * of results (20 seeded products, SHOP_PAGE_SIZE=24), so PaginationLinks's `totalPages <= 1`
 * early-return meant `pageWindow` was never actually invoked. Phase 7's admin orders list is the
 * first real multi-page use of PaginationLinks (proven at 5,000+ seeded orders), which is what
 * surfaced it.
 */
export function pageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
  const items: (number | "ellipsis")[] = [];
  const add = (n: number) => items.push(n);
  const window = 1;

  add(1);
  if (page - window > 2) items.push("ellipsis");
  for (let p = Math.max(2, page - window); p <= Math.min(totalPages - 1, page + window); p++) add(p);
  if (page + window < totalPages - 1) items.push("ellipsis");
  if (totalPages > 1) add(totalPages);

  return items;
}

export const PAGINATION_ARROW_CLASS =
  "flex h-9 min-w-9 items-center justify-center rounded-sm px-2 text-sm text-ink-2 disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-2 aria-disabled:pointer-events-none aria-disabled:opacity-40";
export const PAGINATION_ITEM_CLASS =
  "tabular-nums flex h-9 min-w-9 items-center justify-center rounded-sm px-2 text-sm font-medium hover:bg-surface-2";

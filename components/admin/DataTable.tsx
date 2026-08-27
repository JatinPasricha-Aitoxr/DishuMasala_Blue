import type { ReactNode } from "react";
import { PaginationLinks } from "@/components/ui/PaginationLinks";
import { KeyboardNavRows } from "./KeyboardNavRows";
import { cn } from "@/lib/cn";

/**
 * The one reusable admin table (PROMPTS.md Phase 7 item 2 / CLAUDE.md §9): URL-driven sorting,
 * filtering and pagination — all server-side, exactly like Phase 3's shop filters. This phase only
 * wires it up for Orders, but every column definition below is entity-agnostic on purpose so
 * Phase 8's Products/Collections/Coupons/Reviews/Customers lists can reuse it unchanged.
 *
 * Deliberately NOT a "use client" component: sorting and pagination are real `<a href>` links
 * (works with JS disabled, same discipline as PaginationLinks/shop filters), and `column.render`
 * is a plain function evaluated at request time on the server — never serialized across the
 * server/client boundary. The one genuinely interactive piece (arrow-key/Enter row navigation) is
 * isolated in `KeyboardNavRows`, a small client component that receives the already-rendered
 * `<tr>` elements as children (ReactNode, not a function — safe to pass from a Server Component).
 */
export interface DataTableColumn<T> {
  key: string;
  label: string;
  /** Sortable columns render their header as a link that toggles asc/desc via the URL. */
  sortKey?: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
  /** Plain-text value for the CSV export route to use for this column, when the export is driven
   * off the same row shape rather than a dedicated export query (see app/admin/orders/export). */
  csv?: (row: T) => string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowHref: (row: T) => string;
  rowKey: (row: T) => string | number;
  totalCount: number;
  page: number;
  pageSize: number;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  /** Builds the href for a given set of param overrides (e.g. `{ sort: "total", dir: "asc" }` or
   * `{ page: "3" }`), preserving every other currently-active filter — same shape as
   * `buildShopUrl` in app/shop/page.tsx. */
  hrefFor: (overrides: Record<string, string | undefined>) => string;
  /** Link to a route handler that streams a CSV of the current filtered view (ignoring
   * pagination, respecting every filter) — omit to hide the export control entirely. */
  exportHref?: string;
  emptyMessage?: string;
  /** True while a navigation to a new filter/sort/page is in flight — real, not decorative
   * (rendered via a client wrapper so it can react to Next.js's own loading state). Pages using
   * DataTable inside a <Suspense> boundary get this for free from loading.tsx instead. */
  caption?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowHref,
  rowKey,
  totalCount,
  page,
  pageSize,
  sortKey,
  sortDir = "asc",
  hrefFor,
  exportHref,
  emptyMessage = "Nothing here yet.",
  caption,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function sortHrefFor(column: DataTableColumn<T>): string | undefined {
    if (!column.sortKey) return undefined;
    const nextDir = sortKey === column.sortKey && sortDir === "asc" ? "desc" : "asc";
    return hrefFor({ sort: column.sortKey, dir: nextDir, page: undefined });
  }

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <p className="text-sm text-ink-2">
          {totalCount.toLocaleString("en-IN")} result{totalCount === 1 ? "" : "s"}
        </p>
        {exportHref && (
          <a
            href={exportHref}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brew-2)]"
          >
            Export CSV
          </a>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-16 text-center text-sm text-ink-2">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead className="sticky top-0 z-10 bg-surface-2">
              <tr>
                {columns.map((col) => {
                  const href = sortHrefFor(col);
                  const isSorted = sortKey === col.sortKey;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={isSorted ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                      className={cn(
                        "border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-2",
                        col.align === "right" ? "text-right" : "text-left",
                      )}
                    >
                      {href ? (
                        <a href={href} className="inline-flex items-center gap-1 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brew-2)]">
                          {col.label}
                          {isSorted && <span aria-hidden="true">{sortDir === "asc" ? "▲" : "▼"}</span>}
                        </a>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <KeyboardNavRows>
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  data-row-href={rowHref(row)}
                  tabIndex={0}
                  role="row"
                  className="cursor-pointer border-b border-line last:border-b-0 outline-none hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-brew-2)]"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-ink", col.align === "right" ? "text-right" : "text-left")}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </KeyboardNavRows>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center border-t border-line px-4 py-3">
          <PaginationLinks page={page} totalPages={totalPages} hrefFor={(p) => hrefFor({ page: p === 1 ? undefined : String(p) })} />
        </div>
      )}
    </div>
  );
}

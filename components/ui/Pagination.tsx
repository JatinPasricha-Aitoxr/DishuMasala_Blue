"use client";

import { cn } from "@/lib/cn";

export interface PaginationProps {
  page: number;
  totalPages: number;
  /** Client-driven mode (state, no navigation) — e.g. an admin table (later phases). */
  onPageChange: (page: number) => void;
  className?: string;
}

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

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const items = pageWindow(page, totalPages);
  const ARROW_CLASS = PAGINATION_ARROW_CLASS;
  const ITEM_CLASS = PAGINATION_ITEM_CLASS;

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={() => onPageChange?.(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={ARROW_CLASS}
      >
        Prev
      </button>
      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e${i}`} className="px-1.5 text-ink-3" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange?.(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(ITEM_CLASS, item === page ? "bg-ink text-surface" : "text-ink-2")}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange?.(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={ARROW_CLASS}
      >
        Next
      </button>
    </nav>
  );
}

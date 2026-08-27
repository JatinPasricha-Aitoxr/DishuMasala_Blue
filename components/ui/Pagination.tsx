"use client";

import { cn } from "@/lib/cn";
import { pageWindow, PAGINATION_ARROW_CLASS, PAGINATION_ITEM_CLASS } from "./pagination-shared";

export interface PaginationProps {
  page: number;
  totalPages: number;
  /** Client-driven mode (state, no navigation) — e.g. an admin table (later phases). */
  onPageChange: (page: number) => void;
  className?: string;
}

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

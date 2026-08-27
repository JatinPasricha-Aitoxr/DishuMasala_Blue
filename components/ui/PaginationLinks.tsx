import { cn } from "@/lib/cn";
import { pageWindow, PAGINATION_ARROW_CLASS, PAGINATION_ITEM_CLASS } from "./pagination-shared";

export interface PaginationLinksProps {
  page: number;
  totalPages: number;
  /** Builds the href for a given page number. A plain function is safe here ONLY because this
   * component has no "use client" directive — it never crosses the server/client boundary (a
   * function prop passed from a Server Component into a Client Component is not serialisable and
   * throws; see `components/ui/Pagination.tsx`'s button-based client variant for that case). This
   * one renders real `<a href>` elements at request time and needs no interactivity at all. */
  hrefFor: (page: number) => string;
  className?: string;
}

/** Server-rendered pagination — real `<a href>` per page, no JavaScript required at all (PROMPTS.md
 * Phase 3 item 4: "using real `<a href>` pagination links... explicitly no infinite scroll, no
 * 'load more' button"). Shares its visual language and page-window logic with
 * `components/ui/Pagination.tsx` (the client, button-driven variant future admin tables can use)
 * so the two never look different. */
export function PaginationLinks({ page, totalPages, hrefFor, className }: PaginationLinksProps) {
  if (totalPages <= 1) return null;
  const items = pageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
      {page > 1 ? (
        <a href={hrefFor(page - 1)} className={PAGINATION_ARROW_CLASS} aria-label="Previous page">
          Prev
        </a>
      ) : (
        <span aria-disabled="true" className={PAGINATION_ARROW_CLASS}>
          Prev
        </span>
      )}
      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e${i}`} className="px-1.5 text-ink-3" aria-hidden="true">
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page" className={cn(PAGINATION_ITEM_CLASS, "bg-ink text-surface hover:bg-ink")}>
            {item}
          </span>
        ) : (
          <a key={item} href={hrefFor(item)} className={PAGINATION_ITEM_CLASS}>
            {item}
          </a>
        ),
      )}
      {page < totalPages ? (
        <a href={hrefFor(page + 1)} className={PAGINATION_ARROW_CLASS} aria-label="Next page">
          Next
        </a>
      ) : (
        <span aria-disabled="true" className={PAGINATION_ARROW_CLASS}>
          Next
        </span>
      )}
    </nav>
  );
}

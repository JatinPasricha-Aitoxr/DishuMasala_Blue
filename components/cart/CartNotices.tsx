"use client";

import { useCartStore } from "@/lib/store/cart";

/** Plain-language corrections the server made to the cart (a price changed, an item went out of
 * stock) — announced to assistive tech via `aria-live`, never silently applied (CLAUDE.md §7.5 /
 * PROMPTS.md Phase 5 item 1: "surface what changed to the user in plain language"). */
export function CartNotices() {
  const notices = useCartStore((s) => s.notices);
  const dismissNotice = useCartStore((s) => s.dismissNotice);

  if (notices.length === 0) return null;

  return (
    <div aria-live="polite" role="status" className="flex flex-col gap-2">
      {notices.map((notice) => (
        <div key={notice.id} className="flex items-start justify-between gap-3 rounded-md border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-ink">
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => dismissNotice(notice.id)}
            aria-label="Dismiss notice"
            className="shrink-0 text-ink-2 hover:text-ink"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

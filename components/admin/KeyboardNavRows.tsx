"use client";

import { useRouter } from "next/navigation";
import type { ReactNode, KeyboardEvent } from "react";

/**
 * The keyboard-navigation layer for DataTable (PROMPTS.md Phase 7 item 2: "keyboard navigation
 * (arrow keys/Enter on rows, not just Tab-through)"). Receives the server-rendered `<tbody>` as
 * `children` — a plain ReactNode, safe to pass across the server/client boundary — and adds
 * ArrowUp/ArrowDown to move focus between `[data-row-href]` rows and Enter/Space to navigate,
 * entirely via DOM event delegation so it needs no knowledge of the row data itself.
 */
export function KeyboardNavRows({ children }: { children: ReactNode }) {
  const router = useRouter();

  function handleKeyDown(e: KeyboardEvent<HTMLTableSectionElement>) {
    const target = e.target as HTMLElement;
    const row = target.closest<HTMLElement>("[data-row-href]");
    if (!row) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const rows = Array.from(row.parentElement?.querySelectorAll<HTMLElement>("[data-row-href]") ?? []);
      const index = rows.indexOf(row);
      const nextIndex = e.key === "ArrowDown" ? Math.min(index + 1, rows.length - 1) : Math.max(index - 1, 0);
      rows[nextIndex]?.focus();
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const href = row.dataset.rowHref;
      if (href) router.push(href);
    }
  }

  return <tbody onKeyDown={handleKeyDown}>{children}</tbody>;
}

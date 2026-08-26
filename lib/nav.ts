import type { CollectionSummary } from "@/types/catalog";

/**
 * Which collections group under the "Teas" mega-menu column (CLAUDE.md §7.2 / PROMPTS.md Phase 1:
 * "Teas column containing Blue Tea/Red Tea/Classic & Assam, then Combo Packs, then Spices"). The
 * schema has no nav-grouping column — `collections` is a flat, priority-ordered list — so this
 * fixed set is the one piece of navigation structure not read from the database; the ORDER within
 * and across columns still comes entirely from `collections.priority` via the DB, never a literal
 * number here.
 */
const TEA_COLLECTION_SLUGS = new Set(["blue-tea", "red-tea", "classic-teas"]);

/** Collections that get the small Lemon Shift gradient tile in the mega-menu (CLAUDE.md §5.4:
 * "Blue Tea and Red Tea collection tiles" — Classic & Assam does not). */
export const GRADIENT_TILE_SLUGS = new Set(["blue-tea", "red-tea"]);

export interface MegaMenuColumn {
  label: string;
  items: CollectionSummary[];
}

/**
 * Buckets DB-priority-ordered collections into mega-menu columns: one "Teas" column (if any tea
 * collections exist) followed by one column per remaining collection, in the same relative order
 * the database returned them in (`getCollectionsWithStats()` already sorts by `priority` asc).
 */
export function buildMegaMenuColumns(collections: CollectionSummary[]): MegaMenuColumn[] {
  const teas = collections.filter((c) => TEA_COLLECTION_SLUGS.has(c.slug));
  const rest = collections.filter((c) => !TEA_COLLECTION_SLUGS.has(c.slug));

  const columns: MegaMenuColumn[] = [];
  if (teas.length > 0) columns.push({ label: "Teas", items: teas });
  for (const c of rest) columns.push({ label: c.title, items: [c] });
  return columns;
}

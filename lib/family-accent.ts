/**
 * Resolves the product-family accent token (CLAUDE.md §5.2's "Product-family accents" list —
 * hibiscus, leaf, turmeric, chilli, coriander, pepper) for a given product.
 *
 * The `collections` table has an `accent_token` column, but scripts/seed.ts does not populate it
 * (data/catalog.json has no accent field), so it is null for every seeded row today. Rather than
 * invent a value and write it to the database, this is a pure, deterministic presentation-layer
 * mapping from data that already exists — collection slug and the product's own tags — to the
 * fixed accent list CLAUDE.md itself defines. When the admin (Phase 8) starts writing real
 * `accent_token` values, callers should prefer that column and fall back to this resolver only
 * when it's null.
 */

export type FamilyAccentToken =
  | "brew-2"
  | "hibiscus"
  | "leaf"
  | "turmeric"
  | "chilli"
  | "coriander"
  | "pepper"
  | "gold";

const SPICE_TAG_TOKENS: Array<{ keywords: string[]; token: FamilyAccentToken }> = [
  { keywords: ["turmeric", "haldi"], token: "turmeric" },
  { keywords: ["chilli", "chilly", "chili"], token: "chilli" },
  { keywords: ["coriander"], token: "coriander" },
  { keywords: ["pepper"], token: "pepper" },
];

/**
 * @param collectionSlug the product's collection slug (e.g. "blue-tea", "spices", "combos")
 * @param tags the product's own `tags` column — used to pick a single-origin spice accent for
 *   /spices, and attempted (then falling back) for /combos, which blend more than one spice.
 */
export function resolveFamilyAccent(
  collectionSlug: string,
  tags: readonly string[],
): FamilyAccentToken {
  if (collectionSlug === "blue-tea") return "brew-2";
  if (collectionSlug === "red-tea") return "hibiscus";
  if (collectionSlug === "classic-teas") return "leaf";

  const haystack = tags.join(" ").toLowerCase();
  for (const { keywords, token } of SPICE_TAG_TOKENS) {
    if (keywords.some((k) => haystack.includes(k))) return token;
  }

  // Blends (garam masala, combo packs) touch more than one single-origin spice, so none of the
  // four spice tokens apply cleanly — fall back to the premium hairline gold token rather than
  // guessing at one ingredient.
  return "gold";
}

/** Maps an accent token to its CSS custom property (all tokens live in app/globals.css @theme). */
export function familyAccentVar(token: FamilyAccentToken): string {
  return `var(--color-${token})`;
}

import { paise, type Paise } from "@/lib/money";

/** The minimal shape computeComboSavingPaise actually reads — narrower than the full
 * `ProductCardData` (types/catalog.ts) so it's cheap to unit-test and doesn't accidentally start
 * depending on fields it has no business touching. */
export interface ComboSavingProduct {
  name: string;
  variants: Array<{ optionValue: string; pricePaise: Paise }>;
}

/**
 * Matches a combo product's own name (e.g. "Black Pepper + Garam Masala + Coriander") against the
 * individual spice products it is built from, then compares the combo's displayed (position-0)
 * variant price to the sum of what those same-weight spices cost bought separately — a real
 * computation over real variant prices in paise, read at render time, never a hardcoded percentage
 * or rupee figure (CLAUDE.md §7.3, PROMPTS.md Phase 2 item 5). Returns null — render no claim at
 * all — whenever any part of the match can't be resolved, or the maths doesn't yield a genuine
 * saving (components/sections/ComboValue.tsx is the only caller).
 */
export function computeComboSavingPaise(
  combo: ComboSavingProduct,
  spices: readonly ComboSavingProduct[],
): Paise | null {
  const variant = combo.variants[0];
  if (!variant) return null;

  const components = combo.name
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
  if (components.length < 2) return null;

  // Combo option values are shaped like "100 gm x 3" — a per-item weight and the item count.
  const match = /^(\d+\s*gm)\s*x\s*(\d+)$/i.exec(variant.optionValue.trim());
  if (!match) return null;
  const weightText = match[1].replace(/\s+/g, " ").trim().toLowerCase();
  const expectedCount = Number(match[2]);
  if (expectedCount !== components.length) return null;

  let separateTotalPaise = 0;
  for (const component of components) {
    const spiceProduct = spices.find((s) => s.name.toLowerCase().startsWith(component.toLowerCase()));
    if (!spiceProduct) return null;
    const spiceVariant = spiceProduct.variants.find(
      (v) => v.optionValue.trim().toLowerCase() === weightText,
    );
    if (!spiceVariant) return null;
    separateTotalPaise += spiceVariant.pricePaise;
  }

  const savingPaise = separateTotalPaise - variant.pricePaise;
  return savingPaise > 0 ? paise(savingPaise) : null;
}

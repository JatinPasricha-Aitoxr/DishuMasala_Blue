import { describe, expect, it } from "vitest";
import { computeComboSavingPaise, type ComboSavingProduct } from "../combo-savings";
import { toPaise } from "../money";

// Real seeded spice prices (data/catalog.json) — see products.ts's toPaise() at seed time.
const SPICES: ComboSavingProduct[] = [
  { name: "Black Pepper Powder", variants: [{ optionValue: "100 gm", pricePaise: toPaise(165) }] },
  {
    name: "Garam Masala Powder",
    variants: [
      { optionValue: "100 gm", pricePaise: toPaise(85) },
      { optionValue: "200 gm", pricePaise: toPaise(160) },
    ],
  },
  {
    name: "Turmeric Powder (Haldi Powder)",
    variants: [
      { optionValue: "100 gm", pricePaise: toPaise(54) },
      { optionValue: "200 gm", pricePaise: toPaise(84) },
    ],
  },
  {
    name: "Red Chilli Powder",
    variants: [
      { optionValue: "100 gm", pricePaise: toPaise(54) },
      { optionValue: "200 gm", pricePaise: toPaise(84) },
    ],
  },
  {
    name: "Coriander Powder",
    variants: [
      { optionValue: "100 gm", pricePaise: toPaise(48) },
      { optionValue: "200 gm", pricePaise: toPaise(80) },
    ],
  },
];

describe("computeComboSavingPaise", () => {
  it("computes a real 3-spice combo saving from actual variant prices (matches the seeded catalogue)", () => {
    const combo: ComboSavingProduct = {
      name: "Black Pepper + Garam Masala + Coriander",
      variants: [{ optionValue: "100 gm x 3", pricePaise: toPaise(279) }],
    };
    // 165 + 85 + 48 = 298; 298 - 279 = 19.
    expect(computeComboSavingPaise(combo, SPICES)).toBe(toPaise(19));
  });

  it("computes a real 2-spice combo saving", () => {
    const combo: ComboSavingProduct = {
      name: "Turmeric + Red Chilli",
      variants: [{ optionValue: "100 gm x 2", pricePaise: toPaise(104) }],
    };
    // 54 + 54 = 108; 108 - 104 = 4.
    expect(computeComboSavingPaise(combo, SPICES)).toBe(toPaise(4));
  });

  it("picks the matching weight variant, not just the first one", () => {
    const combo: ComboSavingProduct = {
      name: "Turmeric + Red Chilli + Coriander",
      variants: [{ optionValue: "200 gm x 3", pricePaise: toPaise(240) }],
    };
    // 84 + 84 + 80 = 248; 248 - 240 = 8.
    expect(computeComboSavingPaise(combo, SPICES)).toBe(toPaise(8));
  });

  it("returns null — no claim — when the combo price already beats the separate total (no genuine saving)", () => {
    const combo: ComboSavingProduct = {
      name: "Black Pepper + Coriander",
      // Separately: 165 + 48 = 213. Price at or above that is not a genuine saving.
      variants: [{ optionValue: "100 gm x 2", pricePaise: toPaise(213) }],
    };
    expect(computeComboSavingPaise(combo, SPICES)).toBeNull();
  });

  it("returns null when a named component has no matching spice product", () => {
    const combo: ComboSavingProduct = {
      name: "Black Pepper + Fennel",
      variants: [{ optionValue: "100 gm x 2", pricePaise: toPaise(150) }],
    };
    expect(computeComboSavingPaise(combo, SPICES)).toBeNull();
  });

  it("returns null when the matched spice has no variant at the combo's weight", () => {
    const combo: ComboSavingProduct = {
      name: "Black Pepper + Garam Masala",
      // Black Pepper Powder only has a 100 gm variant in this fixture.
      variants: [{ optionValue: "200 gm x 2", pricePaise: toPaise(200) }],
    };
    expect(computeComboSavingPaise(combo, SPICES)).toBeNull();
  });

  it("returns null when the component count doesn't match the optionValue's item count", () => {
    const combo: ComboSavingProduct = {
      name: "Black Pepper + Garam Masala + Coriander",
      variants: [{ optionValue: "100 gm x 2", pricePaise: toPaise(200) }],
    };
    expect(computeComboSavingPaise(combo, SPICES)).toBeNull();
  });

  it("returns null when the optionValue doesn't match the expected shape", () => {
    const combo: ComboSavingProduct = {
      name: "Black Pepper + Garam Masala",
      variants: [{ optionValue: "Combo Pack", pricePaise: toPaise(200) }],
    };
    expect(computeComboSavingPaise(combo, SPICES)).toBeNull();
  });

  it("returns null for a product with no variants at all", () => {
    const combo: ComboSavingProduct = { name: "Black Pepper + Garam Masala", variants: [] };
    expect(computeComboSavingPaise(combo, SPICES)).toBeNull();
  });
});

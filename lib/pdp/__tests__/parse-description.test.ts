import { describe, expect, it } from "vitest";
import { parseProductDescription } from "../parse-description";

const BLUE_TEA_DESCRIPTION = `Blue Tea is a naturally caffeine-free herbal tea made from premium Butterfly Pea Flowers. Renowned for its vibrant deep blue colour, delicate floral taste, and wellness benefits, it offers a refreshing and soothing tea experience. It can also change colour to purple when lemon is added, making it both visually appealing and enjoyable.

Key Characteristics:

Flavor: Mild, earthy, and subtly floral with a smooth finish.
Aroma: Light, fresh, and naturally floral.
Ingredients: Butterfly Pea Flower, Spearmint, Ginger, Dandelion, Cinnamon & Lemongrass.
Color: Deep blue infusion that turns purple with lemon.

Culinary Uses:

Herbal Tea: Enjoy hot or iced as a refreshing caffeine-free beverage.
Mocktails & Cocktails: Adds a stunning natural blue hue to drinks.

Health Benefits:

Rich in Antioxidants: Helps protect the body from free radical damage.
Naturally Caffeine-Free: A perfect tea to enjoy any time of the day.

Storage:

Store in an airtight container in a cool, dry place away from direct sunlight.
Keep the pack tightly sealed after every use to maintain freshness, aroma, and colour.`;

describe("parseProductDescription", () => {
  it("extracts Key Characteristics with the Ingredients line stripped out", () => {
    const { keyCharacteristics } = parseProductDescription(BLUE_TEA_DESCRIPTION);
    expect(keyCharacteristics).toContain("Flavor: Mild, earthy");
    expect(keyCharacteristics).toContain("Color: Deep blue infusion");
    expect(keyCharacteristics).not.toContain("Ingredients:");
  });

  it("extracts the ingredients list from Key Characteristics' own Ingredients line", () => {
    const { ingredients } = parseProductDescription(BLUE_TEA_DESCRIPTION);
    expect(ingredients).toBe("Butterfly Pea Flower, Spearmint, Ginger, Dandelion, Cinnamon & Lemongrass.");
  });

  it("maps Culinary Uses to howToUse", () => {
    const { howToUse } = parseProductDescription(BLUE_TEA_DESCRIPTION);
    expect(howToUse).toContain("Herbal Tea: Enjoy hot or iced");
  });

  it("never surfaces Health Benefits content anywhere in its output", () => {
    const parsed = parseProductDescription(BLUE_TEA_DESCRIPTION);
    const serialized = JSON.stringify(parsed);
    expect(serialized).not.toContain("Rich in Antioxidants");
    expect(serialized).not.toContain("free radical");
  });

  it("degrades to all-null for a product description with no structured sections", () => {
    const parsed = parseProductDescription("Just a plain sentence, no sections at all.");
    expect(parsed.keyCharacteristics).toBeNull();
    expect(parsed.ingredients).toBeNull();
    expect(parsed.howToUse).toBeNull();
    expect(parsed.intro).toBe("Just a plain sentence, no sections at all.");
  });

  it("handles a null description without throwing", () => {
    expect(parseProductDescription(null)).toEqual({
      intro: null,
      keyCharacteristics: null,
      ingredients: null,
      howToUse: null,
    });
  });
});

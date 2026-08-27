/**
 * All homepage copy, in one file (Phase 2 / PROMPTS.md). Every claim about Blue Tea and Red Tea is
 * grounded in the client's own existing product copy in `data/catalog.json` (see the `blue-tea` and
 * `red-tea` products' `shortDescription`/`description` fields) — ingredients, flavour, aroma, colour
 * behaviour and caffeine content are all facts the client already states about their own products.
 *
 * Deliberately NOT copied over: the source copy's "Health Benefits" bullet lists (antioxidants,
 * skin/hair, digestion, relaxation, weight management). CLAUDE.md §8 forbids health and medicinal
 * claims on this build regardless of what the old site said, so this file sticks to the sensory and
 * compositional facts (ingredients, caffeine-free, the colour shift itself) and leaves every health
 * claim out. No customer counts, no awards, no certifications — nothing not verifiable is invented.
 */

export const HOME_COPY = {
  blueTeaBand: {
    eyebrow: "The Lemon Shift",
    heading: "Blue, until you add lemon.",
    bodyPrimary:
      "Butterfly pea flower gives Blue Tea its brilliant, brewed-deep-blue colour — a natural " +
      "pigment, not a dye, that shifts with acidity. Add a wedge of lemon and the same cup turns " +
      "violet, then edges toward magenta. Nothing about the tea changes. Only its colour does.",
    bodySecondary:
      "Underneath the colour is a gentle blend: butterfly pea flower with spearmint, ginger, " +
      "dandelion, cinnamon and lemongrass, naturally caffeine-free, so there's no wrong hour to " +
      "brew a cup. Loose leaf or teabags — both carry the same brew and the same shift.",
    ctaLabel: "Shop Blue Tea",
    ctaHref: "/collections/blue-tea/",
  },

  redTea: {
    eyebrow: "Red Tea",
    heading: "Ruby-red. Hibiscus-led. Naturally vibrant.",
    body: [
      "A beautiful infusion of hibiscus and delicate rose petals, balanced with the warming notes " +
        "of holy basil and ginger. Red Tea brews into a naturally ruby-red cup with a refreshing " +
        "tartness, soft floral character, and a gentle hint of spice.",
      "Bright • Floral • Mildly Tart • Caffeine-Free",
      "Available in loose leaf and convenient teabags, it's an easy, refreshing ritual to enjoy " +
        "any time of day.",
    ],
    ctaLabel: "Shop Red Tea",
    ctaHref: "/collections/red-tea/",
  },

  combos: {
    eyebrow: "Combo Packs",
    heading: "Your Everyday Spices, Together.",
    body: [
      "The essentials you reach for most, thoughtfully paired and packed into convenient sets — " +
        "giving you more value than buying each spice separately.",
      "From everyday cooking to flavour-packed favourites, our combo packs make it easier to " +
        "stock your pantry and smarter to save.",
      "Curated Together • Better Value • Pantry Ready",
    ],
  },

  spices: {
    eyebrow: "Spices",
    heading: "Single-Origin. Double-Layer Packed.",
    body: [
      "Turmeric, red chilli, garam masala, coriander, and black pepper — each carefully sourced " +
        "and packed separately to preserve its natural aroma, bold flavour, and freshness.",
      "Our double-layer packaging adds an extra barrier of protection, helping keep every spice " +
        "vibrant from the pack to your kitchen.",
      "Purely Sourced • Carefully Packed • Full of Flavour",
    ],
  },

  classicAssam: {
    eyebrow: "Classic & Assam",
    heading: "Everyday tea, garden-fresh",
    body: "Bold, malty loose-leaf black teas for the everyday pot.",
  },

  ritual: {
    eyebrow: "The Ritual",
    heading: "Brew it blue. Add lemon. Watch it shift.",
    body:
      "Steep a spoonful of Blue Tea in hot water for four to five minutes, until the cup runs a " +
      "deep, brewed blue. Squeeze in a wedge of lemon and watch the colour move — through violet, " +
      "toward magenta — as the acidity meets the butterfly pea flower's natural pigment. Serve it " +
      "hot, or pour it over ice for a cooler shift.",
    ctaLabel: "Read the full ritual",
    ctaHref: "/recipes/blue-tea-lemon-ritual/",
  },

  reviews: {
    heading: "Reviews",
    emptyTitle: "No reviews yet",
    emptyBody:
      "We're just getting started — once customers have brewed a cup, their reviews will appear " +
      "here. If you've tried Dishu Masala, we'd love to hear from you after your order arrives.",
  },

  newsletter: {
    heading: "Brew guides, in your inbox",
    body: "Recipes and brewing notes, sent occasionally. No spam, unsubscribe any time.",
  },
} as const;

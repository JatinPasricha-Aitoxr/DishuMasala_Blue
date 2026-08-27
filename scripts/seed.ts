/**
 * Seeds the database from data/catalog.json: 5 collections, 20 products, 30 variants, the
 * WELCOME5 coupon, and the settings rows CLAUDE.md §7.4 / PROMPTS.md Phase 0 call for.
 *
 * Idempotent: every insert is an upsert keyed on a natural key (collections.slug, products.slug,
 * variants.sku, coupons.code, settings.key), so re-running this script updates existing rows in
 * place instead of duplicating them. It seeds ONLY what data/catalog.json actually contains —
 * no invented reviews, customers, orders or stock counts (CLAUDE.md §7.6, §8).
 *
 * Run with: pnpm db:seed
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toPaise } from "../lib/money";
import { closeScriptDb, scriptDb } from "../lib/db/script-client";
import { collections, coupons, products, settings, variants } from "../lib/db/schema";

interface CatalogVariation {
  sku: string;
  option: string;
  mrp: number;
  price: number;
  discountPct: number;
  inStock: boolean;
}

interface CatalogProduct {
  sku: string;
  slug: string;
  name: string;
  collection: string;
  priorityRank: number;
  tags: string[];
  optionLabel: string;
  shortDescription: string;
  description: string;
  variations: CatalogVariation[];
}

interface CatalogCollection {
  slug: string;
  title: string;
  tagline: string;
  rank: number;
}

interface Catalog {
  currency: string;
  freeShippingThreshold: number;
  collections: CatalogCollection[];
  products: CatalogProduct[];
}

function loadCatalog(): Catalog {
  const raw = readFileSync(join(process.cwd(), "data/catalog.json"), "utf-8");
  return JSON.parse(raw) as Catalog;
}

async function seedCollections(catalog: Catalog): Promise<Map<string, number>> {
  const slugToId = new Map<string, number>();

  for (const c of catalog.collections) {
    const [row] = await scriptDb
      .insert(collections)
      .values({
        slug: c.slug,
        title: c.title,
        tagline: c.tagline,
        priority: c.rank,
      })
      .onConflictDoUpdate({
        target: collections.slug,
        set: {
          title: c.title,
          tagline: c.tagline,
          priority: c.rank,
        },
      })
      .returning({ id: collections.id, slug: collections.slug });

    slugToId.set(row.slug, row.id);
  }

  return slugToId;
}

async function seedProducts(
  catalog: Catalog,
  collectionIdBySlug: Map<string, number>,
): Promise<Map<string, number>> {
  const slugToId = new Map<string, number>();

  for (const p of catalog.products) {
    const collectionId = collectionIdBySlug.get(p.collection);
    if (!collectionId) {
      throw new Error(`seed: product "${p.slug}" references unknown collection "${p.collection}"`);
    }

    const [row] = await scriptDb
      .insert(products)
      .values({
        slug: p.slug,
        name: p.name,
        collectionId,
        shortDescription: p.shortDescription,
        description: p.description,
        tags: p.tags,
        optionLabel: p.optionLabel,
        priority: p.priorityRank,
        status: "published",
      })
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          name: p.name,
          collectionId,
          shortDescription: p.shortDescription,
          description: p.description,
          tags: p.tags,
          optionLabel: p.optionLabel,
          priority: p.priorityRank,
          status: "published",
          updatedAt: new Date(),
        },
      })
      .returning({ id: products.id, slug: products.slug });

    slugToId.set(row.slug, row.id);
  }

  return slugToId;
}

async function seedVariants(catalog: Catalog, productIdBySlug: Map<string, number>): Promise<number> {
  let count = 0;

  for (const p of catalog.products) {
    const productId = productIdBySlug.get(p.slug);
    if (!productId) {
      throw new Error(`seed: no seeded product id for "${p.slug}"`);
    }

    for (const [position, v] of p.variations.entries()) {
      await scriptDb
        .insert(variants)
        .values({
          productId,
          sku: v.sku,
          optionValue: v.option,
          mrpPaise: toPaise(v.mrp),
          pricePaise: toPaise(v.price),
          inStock: v.inStock,
          position,
        })
        .onConflictDoUpdate({
          target: variants.sku,
          set: {
            productId,
            optionValue: v.option,
            mrpPaise: toPaise(v.mrp),
            pricePaise: toPaise(v.price),
            inStock: v.inStock,
            position,
          },
        });
      count += 1;
    }
  }

  return count;
}

async function seedCoupon(): Promise<void> {
  // WELCOME5 — 5% off, first order only — must exist at launch (CLAUDE.md §7.4).
  await scriptDb
    .insert(coupons)
    .values({
      code: "WELCOME5",
      kind: "percent",
      value: 5,
      firstOrderOnly: true,
      active: true,
    })
    .onConflictDoUpdate({
      target: coupons.code,
      set: {
        kind: "percent",
        value: 5,
        firstOrderOnly: true,
        active: true,
      },
    });
}

async function seedSettings(catalog: Catalog): Promise<void> {
  const rows: Array<{ key: string; value: unknown }> = [
    {
      key: "free_shipping_threshold_paise",
      value: toPaise(catalog.freeShippingThreshold),
    },
    {
      // Only the facts actually given anywhere in the project docs (PRD.md, PROMPTS.md Phase 1
      // footer spec) are filled in; nothing else is invented — unknown fields are marked TODO
      // for the client to supply, same as GSTIN below.
      key: "store_address",
      value: {
        businessName: "Dishu Food and Beverages",
        line1: "TODO",
        city: "Sangrur",
        state: "Punjab",
        pincode: "TODO",
        country: "India",
        phone: "+91 99882 27798",
        email: "TODO",
      },
    },
    {
      key: "gstin",
      value: "TODO",
    },
    {
      // Flat shipping fee charged below the free-shipping threshold. No real rate has been
      // supplied by the client yet (unlike freeShippingThreshold, catalog.json carries no such
      // figure) — ₹50 is a placeholder pending confirmation, but it lives here in `settings`
      // precisely so it is never a literal at any pricing call site (lib/commerce/pricing.ts
      // reads it the same way it reads the free-shipping threshold) and can be corrected in one
      // place without a code change once the client confirms a real number.
      key: "standard_shipping_paise",
      value: toPaise(50),
    },
    {
      // Editable from Phase 7's admin settings page (app/admin/settings) — a real, seedable
      // default rather than an invented claim: it states only the free-shipping threshold and the
      // WELCOME5 coupon, both already true facts elsewhere in this seed.
      key: "announcement_bar_text",
      value: "Free shipping over ₹500 · Use code WELCOME5 for 5% off your first order",
    },
    {
      // The degraded/maintenance banner toggle (PROMPTS.md Phase 7 item 6) — off by default.
      key: "maintenance_mode",
      value: false,
    },
  ];

  for (const row of rows) {
    await scriptDb
      .insert(settings)
      .values(row)
      .onConflictDoUpdate({ target: settings.key, set: { value: row.value } });
  }
}

async function main() {
  const catalog = loadCatalog();

  console.log(`Seeding from data/catalog.json: ${catalog.collections.length} collections, ${catalog.products.length} products`);

  const collectionIdBySlug = await seedCollections(catalog);
  console.log(`  collections: ${collectionIdBySlug.size} upserted`);

  const productIdBySlug = await seedProducts(catalog, collectionIdBySlug);
  console.log(`  products: ${productIdBySlug.size} upserted`);

  const variantCount = await seedVariants(catalog, productIdBySlug);
  console.log(`  variants: ${variantCount} upserted`);

  await seedCoupon();
  console.log("  coupon: WELCOME5 upserted");

  await seedSettings(catalog);
  console.log(
    "  settings: 6 rows upserted (free_shipping_threshold_paise, store_address, gstin, standard_shipping_paise, announcement_bar_text, maintenance_mode)",
  );

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeScriptDb();
  });

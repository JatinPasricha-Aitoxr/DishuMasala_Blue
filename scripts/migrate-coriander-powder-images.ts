/**
 * Replaces the Coriander Powder product's PDP gallery with a new, client-supplied photo set
 * (data/products/coriander-powder/1.png .. 7.png) — uploads each to R2 (content-hash keys, same
 * pipeline as scripts/migrate-images.ts) and swaps them in for the product's existing
 * `product_images` rows, rather than appending to them. Some of these images carry the client's
 * own marketing/health-adjacent text baked into the pixels (e.g. "Aids Digestion", "Boosts
 * Metabolism") — the same standing, logged exception as the homepage/section banners (CLAUDE.md
 * §8's 2026-08-28 note): used as-is by client choice, alt text stays a plain factual description
 * rather than repeating or inventing any claim.
 *
 * Run with: pnpm migrate-coriander-powder-images
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildKey, putObject } from "../lib/storage/r2-core";
import { processImage } from "../lib/storage/images";
import { closeScriptDb, eq, scriptDb } from "../lib/db/script-client";
import { productImages, products } from "../lib/db/schema";

const PRODUCT_SLUG = "coriander-powder";
const FILES = ["1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png"];

async function main(): Promise<void> {
  const [product] = await scriptDb
    .select({ id: products.id, slug: products.slug, name: products.name })
    .from(products)
    .where(eq(products.slug, PRODUCT_SLUG))
    .limit(1);

  if (!product) {
    throw new Error(`product "${PRODUCT_SLUG}" not found — run \`pnpm db:seed\` first`);
  }

  const uploaded: { position: number; r2Key: string; width: number; height: number }[] = [];

  for (const [position, file] of FILES.entries()) {
    const buffer = readFileSync(join(process.cwd(), "data/products/coriander-powder", file));
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
    const processed = await processImage(buffer);

    let canonicalKey: string | null = null;
    let canonicalWidth = 0;
    let canonicalHeight = 0;

    for (const derivative of processed.derivatives) {
      const key = buildKey("products", product.slug, hash, derivative.format, `w${derivative.width}`);
      await putObject(key, derivative.buffer, `image/${derivative.format}`);
      if (derivative.format === "webp" && derivative.width >= canonicalWidth) {
        canonicalKey = key;
        canonicalWidth = derivative.width;
        canonicalHeight = derivative.height;
      }
    }

    if (!canonicalKey) throw new Error(`${file}: no webp derivative produced`);
    uploaded.push({ position, r2Key: canonicalKey, width: canonicalWidth, height: canonicalHeight });
    console.log(`[uploaded] #${position}: ${file} -> ${canonicalKey} (${canonicalWidth}x${canonicalHeight})`);
  }

  // Replace, not append — the client asked to change the photos, not add to them.
  await scriptDb.delete(productImages).where(eq(productImages.productId, product.id));

  await scriptDb.insert(productImages).values(
    uploaded.map((img) => ({
      productId: product.id,
      r2Key: img.r2Key,
      alt: `${product.name} — pack photo ${img.position + 1} of ${uploaded.length}`,
      width: img.width,
      height: img.height,
      position: img.position,
      isPrimary: img.position === 0,
    })),
  );

  console.log(`\nproduct_images replaced for "${PRODUCT_SLUG}" (${uploaded.length} images).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeScriptDb();
  });

/**
 * Pulls the site's real logo and favicon source off dishumasala.com, generates AVIF + WebP
 * derivatives with sharp (same pipeline as scripts/migrate-images.ts), uploads them to R2, and
 * upserts a `site_branding` settings row so the header/footer/metadata can render the real brand
 * mark instead of a text wordmark (CLAUDE.md §8: real assets, never invented).
 *
 * Idempotent: re-running downloads fresh (the source may change) but always overwrites the same
 * `brand/logo/...` and `brand/favicon/...` keys, so no orphaned objects accumulate.
 *
 * Run with: pnpm migrate-brand-assets
 */
import { buildKey, putObject } from "../lib/storage/r2-core";
import { processImage } from "../lib/storage/images";
import { closeScriptDb, scriptDb } from "../lib/db/script-client";
import { settings } from "../lib/db/schema";

const LOGO_URL = "https://dishumasala.com/wp-content/uploads/2025/08/logo.png";
const FAVICON_URL = "https://dishumasala.com/wp-content/uploads/2025/08/favicon.png";

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function migrateOne(
  slot: "logo" | "favicon",
  url: string,
  alt: string,
): Promise<{ r2Key: string; width: number; height: number; alt: string }> {
  const buffer = await download(url);
  const processed = await processImage(buffer);

  let canonicalKey: string | null = null;
  let canonicalWidth = 0;
  let canonicalHeight = 0;

  for (const derivative of processed.derivatives) {
    const key = buildKey("brand", slot, "current", derivative.format, `w${derivative.width}`);
    await putObject(key, derivative.buffer, `image/${derivative.format}`);
    if (derivative.format === "webp" && derivative.width >= canonicalWidth) {
      canonicalKey = key;
      canonicalWidth = derivative.width;
      canonicalHeight = derivative.height;
    }
  }

  if (!canonicalKey) throw new Error(`${slot}: no webp derivative produced`);
  console.log(`[uploaded] ${slot}: ${url} -> ${canonicalKey} (${canonicalWidth}x${canonicalHeight})`);
  return { r2Key: canonicalKey, width: canonicalWidth, height: canonicalHeight, alt };
}

async function main(): Promise<void> {
  const [logo, favicon] = await Promise.all([
    migrateOne("logo", LOGO_URL, "Dishu Masala"),
    migrateOne("favicon", FAVICON_URL, "Dishu Masala favicon"),
  ]);

  await scriptDb
    .insert(settings)
    .values({ key: "site_branding", value: { logo, favicon } })
    .onConflictDoUpdate({ target: settings.key, set: { value: { logo, favicon } } });

  console.log("settings.site_branding upserted.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeScriptDb();
  });

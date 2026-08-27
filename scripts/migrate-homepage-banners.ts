/**
 * Uploads the client-supplied homepage promotional banners (data/banners/*.png — provided
 * directly by the client, not scraped from the old site) to R2 and saves
 * `settings.homepage_banners`, an ordered list the homepage slider reads.
 *
 * IMPORTANT — deliberate, explicit exception to CLAUDE.md §8 ("invent nothing" / no health
 * claims): these banners carry the client's own marketing text baked directly into the image
 * pixels, including phrasing like "Belly Fat Reduction & Slimming" that would never be allowed in
 * text content this project writes itself. Claude flagged this conflict directly to the client
 * stakeholder before building it; the client explicitly chose to use the banners as-is anyway
 * (2026-08-28 — see the matching note in CLAUDE.md §8). Do not "fix" this by stripping the
 * claims or reverting to a placeholder without checking with the client again.
 *
 * Run with: pnpm migrate-homepage-banners
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildKey, putObject } from "../lib/storage/r2-core";
import { processImage } from "../lib/storage/images";
import { closeScriptDb, scriptDb } from "../lib/db/script-client";
import { settings } from "../lib/db/schema";

interface BannerSource {
  slot: string;
  file: string;
  alt: string;
  href: string;
}

const BANNERS: BannerSource[] = [
  {
    slot: "raksha-bandhan-gift",
    file: "Raksha Bandhar Banner.png",
    alt: "Happy Raksha Bandhan — Dishu Masala Premium Herbal Red Tea and Blue Tea, a perfect Rakhi gift, free shipping",
    href: "/shop",
  },
  {
    slot: "blue-tea-chai",
    file: "hero banner.png",
    alt: "Blue by Nature, Better by Choice — Dishu Premium Herbal Blue Tea, 100% herbal, caffeine-free, zero sugar, enriched with Butterfly Pea Flower",
    href: "/collections/blue-tea",
  },
];

async function migrateOne(banner: BannerSource): Promise<{
  slot: string;
  r2Key: string;
  width: number;
  height: number;
  alt: string;
  href: string;
}> {
  const buffer = readFileSync(join(process.cwd(), "data/banners", banner.file));
  const processed = await processImage(buffer);

  let canonicalKey: string | null = null;
  let canonicalWidth = 0;
  let canonicalHeight = 0;

  for (const derivative of processed.derivatives) {
    const key = buildKey("banners", banner.slot, "current", derivative.format, `w${derivative.width}`);
    await putObject(key, derivative.buffer, `image/${derivative.format}`);
    if (derivative.format === "webp" && derivative.width >= canonicalWidth) {
      canonicalKey = key;
      canonicalWidth = derivative.width;
      canonicalHeight = derivative.height;
    }
  }

  if (!canonicalKey) throw new Error(`${banner.slot}: no webp derivative produced`);
  console.log(`[uploaded] ${banner.slot}: ${banner.file} -> ${canonicalKey} (${canonicalWidth}x${canonicalHeight})`);
  return {
    slot: banner.slot,
    r2Key: canonicalKey,
    width: canonicalWidth,
    height: canonicalHeight,
    alt: banner.alt,
    href: banner.href,
  };
}

async function main(): Promise<void> {
  const uploaded = await Promise.all(BANNERS.map(migrateOne));

  await scriptDb
    .insert(settings)
    .values({ key: "homepage_banners", value: uploaded })
    .onConflictDoUpdate({ target: settings.key, set: { value: uploaded } });

  console.log(`settings.homepage_banners upserted (${uploaded.length} banners).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeScriptDb();
  });

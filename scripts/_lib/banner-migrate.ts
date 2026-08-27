/**
 * Shared upload logic for the client-supplied banner scripts (migrate-homepage-banners.ts,
 * migrate-red-tea-banner.ts, and any future banner slot) — one real implementation instead of
 * copy-pasting the sharp/R2/content-hash pipeline per script.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildKey, putObject } from "../../lib/storage/r2-core";
import { processImage } from "../../lib/storage/images";
import { scriptDb } from "../../lib/db/script-client";
import { settings } from "../../lib/db/schema";

export interface BannerSource {
  slot: string;
  file: string;
  alt: string;
  href: string;
}

export interface MigratedBanner {
  slot: string;
  r2Key: string;
  width: number;
  height: number;
  alt: string;
  href: string;
}

async function migrateOne(banner: BannerSource): Promise<MigratedBanner> {
  const buffer = readFileSync(join(process.cwd(), "data/banners", banner.file));
  const processed = await processImage(buffer);
  // Content hash (not a fixed "current" slug) so swapping a banner's source image gives every
  // derivative a brand-new key/URL — otherwise the browser and Next's own image-optimizer cache
  // keep serving the previous picture forever under the unchanged URL (a real bug hit and fixed
  // on the homepage banner before this shared helper existed).
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);

  let canonicalKey: string | null = null;
  let canonicalWidth = 0;
  let canonicalHeight = 0;

  for (const derivative of processed.derivatives) {
    const key = buildKey("banners", banner.slot, hash, derivative.format, `w${derivative.width}`);
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

/** Uploads every banner in `sources`, then upserts the result array under `settingsKey`. */
export async function migrateBannerSet(settingsKey: string, sources: BannerSource[]): Promise<MigratedBanner[]> {
  const uploaded = await Promise.all(sources.map(migrateOne));

  await scriptDb
    .insert(settings)
    .values({ key: settingsKey, value: uploaded })
    .onConflictDoUpdate({ target: settings.key, set: { value: uploaded } });

  console.log(`settings.${settingsKey} upserted (${uploaded.length} banner${uploaded.length === 1 ? "" : "s"}).`);
  return uploaded;
}

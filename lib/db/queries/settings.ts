import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../index";
import { settings } from "../schema";
import { paise, type Paise } from "@/lib/money";
import { publicUrl } from "@/lib/storage/r2";

/** Shape of the `store_address` settings row — matches scripts/seed.ts exactly. Unknown facts the
 * client hasn't supplied yet (line1, pincode, email) are seeded as the literal string "TODO" and
 * must be rendered as-is, never invented (CLAUDE.md §8). */
export interface StoreAddress {
  businessName: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
}

const FALLBACK_FREE_SHIPPING_THRESHOLD_PAISE = paise(50_000); // ₹500 — only used if the settings row is somehow missing.

/** Free-shipping threshold in paise, read from `settings` (CLAUDE.md §7.4) — never a hardcoded ₹500 literal at the call site. */
export async function getFreeShippingThresholdPaise(): Promise<Paise> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, "free_shipping_threshold_paise"))
    .limit(1);

  if (row == null || typeof row.value !== "number") {
    return FALLBACK_FREE_SHIPPING_THRESHOLD_PAISE;
  }
  return paise(row.value);
}

/** Store contact/address details for the footer, exactly as scripts/seed.ts seeded them —
 * including the literal "TODO" placeholders where the client hasn't supplied real data yet. */
export async function getStoreAddress(): Promise<StoreAddress | null> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, "store_address"))
    .limit(1);

  if (row == null) return null;
  return row.value as StoreAddress;
}

const FALLBACK_STANDARD_SHIPPING_PAISE = paise(5_000); // ₹50 — only used if the settings row is somehow missing.

/** Flat shipping fee in paise charged below the free-shipping threshold, read from `settings`
 * (never a hardcoded literal at a pricing call site — CLAUDE.md §7.4/§7.5). */
export async function getStandardShippingPaise(): Promise<Paise> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, "standard_shipping_paise"))
    .limit(1);

  if (row == null || typeof row.value !== "number") {
    return FALLBACK_STANDARD_SHIPPING_PAISE;
  }
  return paise(row.value);
}

/** GSTIN for the footer's tax note — "TODO" as seeded until the client supplies a real one. */
export async function getGstin(): Promise<string | null> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, "gstin"))
    .limit(1);

  if (row == null) return null;
  return row.value as string;
}

/** Announcement-bar copy (Phase 7's admin settings). Falls back to a plain, honest default that
 * states only real, always-true facts (the WELCOME5 coupon CLAUDE.md §7.4 guarantees exists) —
 * never an invented claim — if the settings row is somehow missing. */
export async function getAnnouncementBarText(): Promise<string> {
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "announcement_bar_text")).limit(1);
  if (row == null || typeof row.value !== "string") return "Free shipping over ₹500 · Use code WELCOME5 for 5% off your first order";
  return row.value;
}

/** The maintenance/degraded-banner toggle (Phase 7's admin settings, consumed by a future
 * resilience phase's degraded banner per CLAUDE.md §9/PROMPTS.md Phase 9 item 5). Defaults to
 * false (not degraded) if the row is somehow missing. */
export async function getMaintenanceMode(): Promise<boolean> {
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "maintenance_mode")).limit(1);
  if (row == null || typeof row.value !== "boolean") return false;
  return row.value;
}

export interface SiteBrandingAsset {
  r2Key: string;
  width: number;
  height: number;
  alt: string;
}

export interface SiteBranding {
  logo: (SiteBrandingAsset & { url: string }) | null;
  favicon: (SiteBrandingAsset & { url: string }) | null;
}

/** The real logo + favicon migrated off dishumasala.com (scripts/migrate-brand-assets.ts) —
 * `null` for either slot until that script has been run, so callers must render the existing
 * text wordmark as a fallback rather than assume a real asset always exists (same "degrade
 * honestly, never fake it" discipline as every third-party asset in this project). */
export async function getSiteBranding(): Promise<SiteBranding> {
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "site_branding")).limit(1);
  const value = row?.value as { logo?: SiteBrandingAsset; favicon?: SiteBrandingAsset } | undefined;

  return {
    logo: value?.logo ? { ...value.logo, url: publicUrl(value.logo.r2Key) } : null,
    favicon: value?.favicon ? { ...value.favicon, url: publicUrl(value.favicon.r2Key) } : null,
  };
}

/** Every settings row the admin settings page (Phase 7 item 6) reads and edits, in one round
 * trip — the "one typed helper" every settings read in this codebase goes through (grepped and
 * confirmed at the end of Phase 7: no component reads `settings` ad hoc or hardcodes a literal
 * that belongs here instead). */
export interface AdminSettingsSnapshot {
  freeShippingThresholdPaise: Paise;
  standardShippingPaise: Paise;
  storeAddress: StoreAddress;
  gstin: string;
  announcementBarText: string;
  maintenanceMode: boolean;
}

const EMPTY_STORE_ADDRESS: StoreAddress = {
  businessName: "Dishu Food and Beverages",
  line1: "TODO",
  city: "TODO",
  state: "TODO",
  pincode: "TODO",
  country: "India",
  phone: "TODO",
  email: "TODO",
};

export async function getAdminSettingsSnapshot(): Promise<AdminSettingsSnapshot> {
  const [freeShippingThresholdPaise, standardShippingPaise, storeAddress, gstin, announcementBarText, maintenanceMode] =
    await Promise.all([
      getFreeShippingThresholdPaise(),
      getStandardShippingPaise(),
      getStoreAddress(),
      getGstin(),
      getAnnouncementBarText(),
      getMaintenanceMode(),
    ]);
  return {
    freeShippingThresholdPaise,
    standardShippingPaise,
    storeAddress: storeAddress ?? EMPTY_STORE_ADDRESS,
    gstin: gstin ?? "TODO",
    announcementBarText,
    maintenanceMode,
  };
}

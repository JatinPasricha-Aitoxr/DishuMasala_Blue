import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../index";
import { settings } from "../schema";
import { paise, type Paise } from "@/lib/money";

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

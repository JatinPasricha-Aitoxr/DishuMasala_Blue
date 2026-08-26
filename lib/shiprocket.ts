import "server-only";

import { getPincodeCache } from "@/lib/db/queries/pincode";
import { upsertPincodeCache } from "@/lib/db/mutations/pincode";
import { getStoreAddress } from "@/lib/db/queries/settings";

/**
 * Shiprocket integration — Phase 4 scope is deliberately narrow: pincode serviceability only,
 * backed by `pincode_cache` with a TTL. Phase 5 (checkout) extends this same file with auth-token
 * caching, order push, and tracking — do not add those here yet (CLAUDE.md §12 phase boundary).
 *
 * No SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD exist in this dev environment. Rather than fake a real
 * Shiprocket response, "credentials not configured" is treated exactly like any other API failure
 * — both degrade gracefully to an honest "couldn't check right now" result and never block the
 * buy flow (CLAUDE.md's stock/scarcity honesty principle extends here: never invent an ETA).
 */

const CACHE_TTL_HOURS = 24;
const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

export type ServiceabilityResult =
  | { status: "serviceable"; codAvailable: boolean; etaDays: number | null; source: "cache" | "live" }
  | { status: "unserviceable"; source: "cache" | "live" }
  | { status: "unavailable"; reason: "not_configured" | "api_error" };

function isFresh(checkedAt: Date): boolean {
  return Date.now() - checkedAt.getTime() < CACHE_TTL_HOURS * 60 * 60 * 1000;
}

/**
 * Checks whether a 6-digit Indian pincode is serviceable, whether COD is available, and a rough
 * ETA in days — reading through `pincode_cache` first (TTL `CACHE_TTL_HOURS`), and only calling
 * out to Shiprocket's live API on a cache miss/stale entry. Never throws: every failure mode
 * (unconfigured credentials, network/API error) resolves to `{ status: "unavailable", ... }` so
 * callers can render a plain, non-alarming message and let the purchase continue regardless.
 */
export async function checkPincodeServiceability(pincode: string): Promise<ServiceabilityResult> {
  const cached = await getPincodeCache(pincode);
  if (cached && isFresh(cached.checkedAt)) {
    return cached.serviceable
      ? { status: "serviceable", codAvailable: cached.codAvailable, etaDays: cached.etaDays, source: "cache" }
      : { status: "unserviceable", source: "cache" };
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const storeAddress = await getStoreAddress();
  // The seeded store pincode is the literal string "TODO" (scripts/seed.ts — the client hasn't
  // supplied a real pickup pincode yet). Without a real pickup pincode there is no honest
  // serviceability question to ask Shiprocket, so this is treated the same as missing
  // credentials rather than sending a fabricated pickup_postcode.
  const pickupPincode = storeAddress?.pincode;
  const hasRealPickupPincode = pickupPincode != null && /^\d{6}$/.test(pickupPincode);

  if (!email || !password || !hasRealPickupPincode) {
    // Treated the same as an API failure (per PROMPTS.md Phase 4): degrade honestly. If a stale
    // cache row exists, prefer it over a flat "unavailable" — a day-old real answer is more useful
    // than none, and it's clearly labelled `source: "cache"` so the UI can say so if it wants to.
    if (cached) {
      return cached.serviceable
        ? { status: "serviceable", codAvailable: cached.codAvailable, etaDays: cached.etaDays, source: "cache" }
        : { status: "unserviceable", source: "cache" };
    }
    return { status: "unavailable", reason: "not_configured" };
  }

  try {
    const result = await fetchLiveServiceability(pincode, pickupPincode, email, password);
    await upsertPincodeCache({
      pincode,
      serviceable: result.status === "serviceable",
      codAvailable: result.status === "serviceable" ? result.codAvailable : false,
      etaDays: result.status === "serviceable" ? result.etaDays : null,
    });
    return result;
  } catch {
    if (cached) {
      return cached.serviceable
        ? { status: "serviceable", codAvailable: cached.codAvailable, etaDays: cached.etaDays, source: "cache" }
        : { status: "unserviceable", source: "cache" };
    }
    return { status: "unavailable", reason: "api_error" };
  }
}

async function fetchLiveServiceability(
  pincode: string,
  pickupPincode: string,
  email: string,
  password: string,
): Promise<ServiceabilityResult> {
  // Auth-token caching is Phase 5's job (this file's header comment) — Phase 4 only ever needs
  // one short-lived token per lookup, so a fresh login per call is acceptable here and avoids
  // building token-cache plumbing this phase doesn't otherwise need.
  const authRes = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!authRes.ok) throw new Error(`Shiprocket auth failed: ${authRes.status}`);
  const { token } = (await authRes.json()) as { token: string };

  const res = await fetch(
    `${SHIPROCKET_BASE_URL}/courier/serviceability/?pickup_postcode=${encodeURIComponent(pickupPincode)}&delivery_postcode=${encodeURIComponent(pincode)}&cod=1&weight=0.5`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Shiprocket serviceability failed: ${res.status}`);
  const data = (await res.json()) as {
    data?: { available_courier_companies?: Array<{ cod: number; etd?: string; estimated_delivery_days?: string }> };
  };

  const couriers = data.data?.available_courier_companies ?? [];
  if (couriers.length === 0) return { status: "unserviceable", source: "live" };

  const codAvailable = couriers.some((c) => c.cod === 1);
  const etaDays = couriers
    .map((c) => Number(c.estimated_delivery_days))
    .filter((n) => Number.isFinite(n))
    .reduce<number | null>((min, n) => (min == null || n < min ? n : min), null);

  return { status: "serviceable", codAvailable, etaDays, source: "live" };
}

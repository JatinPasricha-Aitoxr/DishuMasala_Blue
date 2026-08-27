import "server-only";

import { getPincodeCache } from "@/lib/db/queries/pincode";
import { upsertPincodeCache } from "@/lib/db/mutations/pincode";
import { getStoreAddress } from "@/lib/db/queries/settings";

/**
 * Shiprocket integration. Phase 4 built pincode serviceability only, backed by `pincode_cache`
 * with a TTL. Phase 5 (checkout) extends this same file with auth-token caching, order push, and
 * tracking, per that phase's plan — everything below the pincode section is new.
 *
 * No SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD exist in this dev environment. Rather than fake a real
 * Shiprocket response, "credentials not configured" is treated exactly like any other API failure
 * — both degrade gracefully to an honest "couldn't check right now" result and never block the
 * buy flow (CLAUDE.md's stock/scarcity honesty principle extends here: never invent an ETA). The
 * same rule applies to order push: a Shiprocket outage or missing credentials must never block
 * order confirmation (CLAUDE.md §7.2) — a push that can't complete is left "needs retry" by simply
 * not writing `shiprocket_order_id`, which is exactly the signal Phase 7's admin will query on.
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
  const token = await getAuthToken(email, password);

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

// ---------------------------------------------------------------------------------------------
// Phase 5: auth-token caching, order push, tracking.
// ---------------------------------------------------------------------------------------------

/** Module-scope, in-memory cache of the last-obtained auth token and its real expiry — Shiprocket
 * tokens are valid ~10 days; re-authenticating on every call would be both slow and needless.
 * Scoped to one warm serverless instance/process, which is the right lifetime for this: a cold
 * start re-authenticates once, exactly like any other in-memory cache in this codebase (there is
 * no shared-cache requirement here — pincode_cache is the durable, cross-instance layer;
 * this is purely a same-process optimisation on top of it). */
let cachedToken: { token: string; expiresAt: number } | null = null;

// Shiprocket doesn't return an explicit expiry with the token; its documented lifetime is ~10
// days. Caching for a conservative 9 hours keeps a long-lived serverless/PM2 process from ever
// presenting a token close to its real expiry, while still avoiding a login call on every request.
const TOKEN_CACHE_MS = 9 * 60 * 60 * 1000;

async function getAuthToken(email: string, password: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  const authRes = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!authRes.ok) throw new Error(`Shiprocket auth failed: ${authRes.status}`);
  const { token } = (await authRes.json()) as { token: string };
  cachedToken = { token, expiresAt: Date.now() + TOKEN_CACHE_MS };
  return token;
}

export interface ShiprocketOrderItemInput {
  name: string;
  sku: string;
  units: number;
  sellingPriceRupees: number;
}

export interface ShiprocketOrderInput {
  orderNumber: string;
  orderDateIso: string;
  email: string;
  phone: string;
  shippingAddress: { name: string; line1: string; line2?: string; city: string; state: string; pincode: string };
  items: ShiprocketOrderItemInput[];
  subtotalRupees: number;
  paymentMethod: "razorpay" | "cod";
}

export type ShiprocketPushResult =
  | { status: "pushed"; shiprocketOrderId: string }
  | { status: "needs_retry"; reason: "not_configured" | "api_error" };

/**
 * Pushes a just-confirmed Dishu order into Shiprocket as an adhoc order (CLAUDE.md §7.2). Only
 * ever called after the order is durably confirmed (app/api/payment/verify/route.ts, the COD path
 * in app/api/checkout/route.ts) — never inside the checkout DB transaction, and its failure must
 * never undo or block that confirmation. Callers write `shiprocketOrderId` back onto the order row
 * on success; on `needs_retry` they simply leave it null, which is itself the "outstanding, needs
 * retry" signal Phase 7's admin queries against (no separate status column needed).
 *
 * AWB/courier assignment is a deliberately separate, later step (Phase 7's one-click dispatch) —
 * Shiprocket's own flow requires generating an AWB after order creation, and doing that
 * automatically here would pick a courier with no staff involved at all.
 */
export async function pushOrderToShiprocket(input: ShiprocketOrderInput): Promise<ShiprocketPushResult> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const storeAddress = await getStoreAddress();
  const pickupPincode = storeAddress?.pincode;
  const hasRealPickupPincode = pickupPincode != null && /^\d{6}$/.test(pickupPincode);

  if (!email || !password || !hasRealPickupPincode) {
    return { status: "needs_retry", reason: "not_configured" };
  }

  try {
    const token = await getAuthToken(email, password);
    const [firstName, ...rest] = input.shippingAddress.name.trim().split(/\s+/);
    const res = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        order_id: input.orderNumber,
        order_date: input.orderDateIso,
        pickup_location: "Primary",
        billing_customer_name: firstName || input.shippingAddress.name,
        billing_last_name: rest.join(" "),
        billing_address: input.shippingAddress.line1,
        billing_address_2: input.shippingAddress.line2 ?? "",
        billing_city: input.shippingAddress.city,
        billing_pincode: input.shippingAddress.pincode,
        billing_state: input.shippingAddress.state,
        billing_country: "India",
        billing_email: input.email,
        billing_phone: input.phone,
        shipping_is_billing: true,
        order_items: input.items.map((item) => ({
          name: item.name,
          sku: item.sku,
          units: item.units,
          selling_price: item.sellingPriceRupees,
        })),
        payment_method: input.paymentMethod === "cod" ? "COD" : "Prepaid",
        sub_total: input.subtotalRupees,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      }),
    });
    if (!res.ok) return { status: "needs_retry", reason: "api_error" };
    const data = (await res.json()) as { order_id?: number };
    if (data.order_id == null) return { status: "needs_retry", reason: "api_error" };
    return { status: "pushed", shiprocketOrderId: String(data.order_id) };
  } catch {
    return { status: "needs_retry", reason: "api_error" };
  }
}

export interface TrackingStatus {
  status: string;
  currentLocation: string | null;
  etd: string | null;
}

/** Looks up live tracking for an AWB — used by Phase 7's admin and any future account order-detail
 * view. Never throws: an unconfigured/unreachable Shiprocket resolves to null. */
export async function getTrackingStatus(awb: string): Promise<TrackingStatus | null> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) return null;

  try {
    const token = await getAuthToken(email, password);
    const res = await fetch(`${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(awb)}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      tracking_data?: { track_status?: number; shipment_track?: Array<{ current_status?: string; location?: string }>; etd?: string };
    };
    const latest = data.tracking_data?.shipment_track?.[0];
    if (!latest) return null;
    return {
      status: latest.current_status ?? "in_transit",
      currentLocation: latest.location ?? null,
      etd: data.tracking_data?.etd ?? null,
    };
  } catch {
    return null;
  }
}

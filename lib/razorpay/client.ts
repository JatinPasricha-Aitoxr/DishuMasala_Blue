import "server-only";

/**
 * The Razorpay Orders-API boundary (CLAUDE.md §2 / PROMPTS.md Phase 5 item 6). No real Razorpay
 * account exists in this environment (`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` unset in `.env`) —
 * this interface is what lets the checkout route be built and tested for real without one:
 * `getRazorpayClient()` returns `null` when credentials are absent, and every caller is required
 * to handle that by degrading honestly ("payments temporarily unavailable, try COD"), never by
 * faking a successful order/payment. Tests inject a `RazorpayClient` fake directly.
 */
export interface RazorpayOrder {
  id: string;
  amountPaise: number;
  currency: string;
}

export interface RazorpayClient {
  keyId: string;
  createOrder(input: { amountPaise: number; receipt: string; notes?: Record<string, string> }): Promise<RazorpayOrder>;
}

class HttpRazorpayClient implements RazorpayClient {
  constructor(
    public keyId: string,
    private keySecret: string,
  ) {}

  async createOrder(input: { amountPaise: number; receipt: string; notes?: Record<string, string> }): Promise<RazorpayOrder> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: "INR",
        receipt: input.receipt,
        notes: input.notes ?? {},
      }),
    });
    if (!res.ok) {
      throw new RazorpayApiError(`Razorpay order creation failed: HTTP ${res.status}`);
    }
    const data = (await res.json()) as { id: string; amount: number; currency: string };
    return { id: data.id, amountPaise: data.amount, currency: data.currency };
  }
}

export class RazorpayApiError extends Error {}

/** Returns null — not a throw — when RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET aren't configured, so
 * every call site is forced to handle "payments unavailable" as a normal, expected outcome. */
export function getRazorpayClient(): RazorpayClient | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new HttpRazorpayClient(keyId, keySecret);
}

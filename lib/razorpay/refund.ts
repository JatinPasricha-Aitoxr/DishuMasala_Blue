import "server-only";

/**
 * The Razorpay refund boundary — same honest-degrade shape as lib/razorpay/client.ts's order
 * creation (CLAUDE.md-style: no real Razorpay account exists in this environment, so
 * `getRazorpayRefundClient()` returns null when credentials are absent, and every caller must
 * handle that by recording the refund in the DB regardless while being honest that the real
 * refund call couldn't be attempted). A real key makes it a real call with no code change.
 */
export interface RazorpayRefundResult {
  id: string;
  status: string;
}

export interface RazorpayRefundClient {
  createRefund(paymentId: string, amountPaise: number, notes?: Record<string, string>): Promise<RazorpayRefundResult>;
}

class HttpRazorpayRefundClient implements RazorpayRefundClient {
  constructor(
    private keyId: string,
    private keySecret: string,
  ) {}

  async createRefund(
    paymentId: string,
    amountPaise: number,
    notes: Record<string, string> = {},
  ): Promise<RazorpayRefundResult> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount: amountPaise, notes }),
    });
    if (!res.ok) throw new RazorpayRefundApiError(`Razorpay refund failed: HTTP ${res.status}`);
    const data = (await res.json()) as { id: string; status: string };
    return { id: data.id, status: data.status };
  }
}

export class RazorpayRefundApiError extends Error {}

let testOverrideClient: RazorpayRefundClient | null | undefined = undefined;
/** TEST-ONLY escape hatch, same shape as lib/razorpay/client.ts's — never reachable from a real
 * request path (nothing in app/ calls this). */
export function __setTestRazorpayRefundClient(client: RazorpayRefundClient | null | undefined): void {
  testOverrideClient = client;
}

/** Returns null — not a throw — when RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET aren't configured, so
 * the refund action is forced to handle "couldn't reach Razorpay" as a normal, expected outcome
 * and still record the refund in the DB. */
export function getRazorpayRefundClient(): RazorpayRefundClient | null {
  if (testOverrideClient !== undefined) return testOverrideClient;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new HttpRazorpayRefundClient(keyId, keySecret);
}

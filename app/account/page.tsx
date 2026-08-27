import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getOrdersForUser } from "@/lib/db/queries/orders";
import { getAddressesForUser } from "@/lib/db/queries/addresses";
import { getWishlistCount } from "@/lib/db/queries/wishlist";
import { formatINR } from "@/lib/money";

export const metadata = { title: "Your account", robots: { index: false, follow: false } };

/** A real dashboard, not an empty landing page (PROMPTS.md Phase 6 item 3). Every query here is
 * filtered by the session's userId (lib/db/queries/*), the redundant server-side check for this
 * page beyond middleware.ts. */
export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [orders, addresses, wishlistCount] = await Promise.all([
    getOrdersForUser(user.id),
    getAddressesForUser(user.id),
    getWishlistCount(user.id),
  ]);

  const recentOrders = orders.slice(0, 3);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link href="/account/orders" className="rounded-lg border border-line bg-surface p-4 hover:border-ink/30">
          <p className="text-2xl font-semibold tabular-nums text-ink">{orders.length}</p>
          <p className="text-sm text-ink-2">Orders</p>
        </Link>
        <Link href="/account/addresses" className="rounded-lg border border-line bg-surface p-4 hover:border-ink/30">
          <p className="text-2xl font-semibold tabular-nums text-ink">{addresses.length}</p>
          <p className="text-sm text-ink-2">Saved addresses</p>
        </Link>
        <Link href="/account/wishlist" className="rounded-lg border border-line bg-surface p-4 hover:border-ink/30">
          <p className="text-2xl font-semibold tabular-nums text-ink">{wishlistCount}</p>
          <p className="text-sm text-ink-2">Wishlist items</p>
        </Link>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-2">Recent orders</h2>
          {orders.length > 0 && (
            <Link href="/account/orders" className="text-sm font-medium text-ink underline underline-offset-4">
              View all
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-8 text-center">
            <p className="text-sm text-ink-2">You haven&apos;t placed an order yet.</p>
            <Link href="/shop/" className="mt-3 inline-block text-sm font-medium text-ink underline underline-offset-4">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-surface p-4 hover:border-ink/30"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{order.orderNumber}</p>
                    <p className="text-xs capitalize text-ink-2">{order.status}</p>
                  </div>
                  <p className="tabular-nums text-sm font-semibold text-ink">{formatINR(order.totalPaise)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

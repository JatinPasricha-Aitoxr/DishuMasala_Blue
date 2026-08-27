import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import {
  getDashboardTotals,
  getOrdersAwaitingDispatchCount,
  getLowOrOutOfStockCount,
  getPendingReviewsCount,
  getNeedsRetryShiprocketCount,
  getRevenueSparkline30d,
} from "@/lib/db/queries/admin-dashboard";
import { formatINR } from "@/lib/money";
import { RevenueSparkline } from "@/components/admin/RevenueSparkline";

export const metadata = { title: "Dashboard" };

/**
 * The admin dashboard (CLAUDE.md §9 / PROMPTS.md Phase 7 item 3). Every tile is a real query
 * result (lib/db/queries/admin-dashboard.ts) linking to its own correctly pre-filtered list —
 * "no vanity metrics". Money is formatted exactly once, here, via formatINR — never twice, never
 * inside a query.
 */
export default async function AdminDashboardPage() {
  const session = await requireStaffOrAdmin();
  if (!session.ok) redirect("/login?callbackUrl=/admin");

  const [totals, awaitingDispatch, lowStock, pendingReviews, needsRetry, sparkline] = await Promise.all([
    getDashboardTotals(),
    getOrdersAwaitingDispatchCount(),
    getLowOrOutOfStockCount(),
    getPendingReviewsCount(),
    getNeedsRetryShiprocketCount(),
    getRevenueSparkline30d(),
  ]);

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(
          [
            { label: "Today", data: totals.today, href: "/admin/orders" },
            { label: "Last 7 days", data: totals.last7Days, href: "/admin/orders?from=" + isoDaysAgo(6) },
            { label: "Last 30 days", data: totals.last30Days, href: "/admin/orders?from=" + isoDaysAgo(29) },
          ] as const
        ).map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-lg border border-line bg-surface p-5 hover:border-ink/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brew-2)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-2">{tile.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{formatINR(tile.data.revenuePaise)}</p>
            <p className="mt-1 text-sm text-ink-2">
              {tile.data.orderCount} order{tile.data.orderCount === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardTile
          href="/admin/orders?status=confirmed"
          label="Awaiting dispatch"
          value={awaitingDispatch}
          tone={awaitingDispatch > 0 ? "warn" : "ok"}
        />
        <DashboardTile href="/admin/coming-soon?section=Products" label="Low or out of stock" value={lowStock} tone={lowStock > 0 ? "warn" : "ok"} />
        <DashboardTile href="/admin/coming-soon?section=Reviews" label="Pending reviews" value={pendingReviews} tone={pendingReviews > 0 ? "warn" : "ok"} />
        <DashboardTile
          href="/admin/orders?status=confirmed"
          label="Shiprocket needs retry"
          value={needsRetry}
          tone={needsRetry > 0 ? "crit" : "ok"}
        />
      </div>

      <div className="mt-6 rounded-lg border border-line bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-2">Revenue — last 30 days</p>
        <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
          {formatINR(totals.last30Days.revenuePaise)} total
        </p>
        <div className="mt-4 h-48">
          <RevenueSparkline points={sparkline.map((p) => ({ date: p.date, revenue: p.revenuePaise / 100 }))} />
        </div>
      </div>
    </div>
  );
}

function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function DashboardTile({ href, label, value, tone }: { href: string; label: string; value: number; tone: "ok" | "warn" | "crit" }) {
  const toneClass = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-crit";
  return (
    <Link
      href={href}
      className="rounded-lg border border-line bg-surface p-5 hover:border-ink/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brew-2)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-2">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </Link>
  );
}

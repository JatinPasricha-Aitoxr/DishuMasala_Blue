import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatINR, paise } from "@/lib/money";
import { listAdminCoupons, type AdminCouponRow } from "@/lib/db/queries/admin-coupons";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const session = await requireStaffOrAdmin();
  if (!session.ok) redirect("/login?callbackUrl=/admin/coupons");

  const rows = await listAdminCoupons();

  const columns: DataTableColumn<AdminCouponRow>[] = [
    { key: "code", label: "Code", render: (r) => <span className="font-mono font-medium text-ink">{r.code}</span> },
    {
      key: "value",
      label: "Value",
      render: (r) => (r.kind === "percent" ? `${r.value}%` : formatINR(paise(r.value))),
    },
    { key: "minSpend", label: "Min spend", align: "right", render: (r) => (r.minSpendPaise != null ? formatINR(paise(r.minSpendPaise)) : "—") },
    { key: "firstOrder", label: "First order only", render: (r) => (r.firstOrderOnly ? "Yes" : "No") },
    { key: "usage", label: "Usage", align: "right", render: (r) => `${r.usedCount}${r.usageLimit != null ? ` / ${r.usageLimit}` : ""}` },
    { key: "perUser", label: "Per-user limit", align: "right", render: (r) => r.perUserLimit ?? "—" },
    { key: "active", label: "Active", render: (r) => <Badge tone={r.active ? "ok" : "neutral"}>{r.active ? "Active" : "Inactive"}</Badge> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Coupons</h1>
        <Button asChild variant="solid-ink" size="sm">
          <Link href="/admin/coupons/new">New coupon</Link>
        </Button>
      </div>
      <div className="mt-5">
        <DataTable
          columns={columns}
          rows={rows}
          rowHref={(r) => `/admin/coupons/${r.id}`}
          rowKey={(r) => r.id}
          totalCount={rows.length}
          page={1}
          pageSize={rows.length || 1}
          hrefFor={() => "/admin/coupons"}
          emptyMessage="No coupons yet."
          caption="Coupons"
        />
      </div>
    </div>
  );
}

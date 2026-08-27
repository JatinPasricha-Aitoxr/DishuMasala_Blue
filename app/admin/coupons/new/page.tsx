import { redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { listProductsAndCollectionsForPicker } from "@/lib/db/queries/admin-coupons";
import { CouponForm } from "../CouponForm";

export const metadata = { title: "New coupon" };

export default async function NewCouponPage() {
  const session = await requireStaffOrAdmin();
  if (!session.ok) redirect("/login?callbackUrl=/admin/coupons/new");

  const picker = await listProductsAndCollectionsForPicker();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">New coupon</h1>
      <div className="mt-6">
        <CouponForm mode="create" picker={picker} />
      </div>
    </div>
  );
}

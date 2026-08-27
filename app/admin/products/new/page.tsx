import { redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { listCollectionsForPicker } from "@/lib/db/queries/admin-products";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const session = await requireStaffOrAdmin();
  if (!session.ok) redirect("/login?callbackUrl=/admin/products/new");

  const collections = await listCollectionsForPicker();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">New product</h1>
      <div className="mt-6">
        <ProductForm mode="create" collections={collections} />
      </div>
    </div>
  );
}

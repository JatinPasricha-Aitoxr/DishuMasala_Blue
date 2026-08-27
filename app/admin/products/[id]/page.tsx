import { notFound, redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { getAdminProductById, listCollectionsForPicker } from "@/lib/db/queries/admin-products";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaffOrAdmin();
  if (!session.ok) redirect("/login?callbackUrl=/admin/products");

  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const [product, collections] = await Promise.all([getAdminProductById(productId), listCollectionsForPicker()]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{product.name}</h1>
      <div className="mt-6">
        <ProductForm mode="edit" product={product} collections={collections} />
      </div>
    </div>
  );
}

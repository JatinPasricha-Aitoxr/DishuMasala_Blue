import { redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { listProductsForRelatedPicker } from "@/lib/db/queries/admin-content";
import { PostForm } from "../PostForm";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  const session = await requireStaffOrAdmin();
  if (!session.ok) redirect("/login?callbackUrl=/admin/content/posts/new");
  const products = await listProductsForRelatedPicker();
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">New post</h1>
      <div className="mt-6">
        <PostForm mode="create" products={products} />
      </div>
    </div>
  );
}

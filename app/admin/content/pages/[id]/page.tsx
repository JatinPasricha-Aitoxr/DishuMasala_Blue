import { notFound, redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { getAdminPageById } from "@/lib/db/queries/admin-content";
import { PageForm } from "../PageForm";

export const metadata = { title: "Edit page" };

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaffOrAdmin();
  if (!session.ok) redirect("/login?callbackUrl=/admin/content");

  const { id } = await params;
  const pageId = Number(id);
  if (!Number.isInteger(pageId)) notFound();

  const page = await getAdminPageById(pageId);
  if (!page) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{page.title}</h1>
      <div className="mt-6">
        <PageForm mode="edit" page={page} />
      </div>
    </div>
  );
}

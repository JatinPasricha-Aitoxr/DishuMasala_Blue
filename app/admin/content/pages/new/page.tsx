import { redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { PageForm } from "../PageForm";

export const metadata = { title: "New page" };

export default async function NewPagePage() {
  const session = await requireStaffOrAdmin();
  if (!session.ok) redirect("/login?callbackUrl=/admin/content/pages/new");
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">New page</h1>
      <div className="mt-6">
        <PageForm mode="create" />
      </div>
    </div>
  );
}

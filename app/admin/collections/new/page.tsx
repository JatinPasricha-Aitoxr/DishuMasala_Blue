import { redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { CollectionForm } from "../CollectionForm";

export const metadata = { title: "New collection" };

export default async function NewCollectionPage() {
  const session = await requireStaffOrAdmin();
  if (!session.ok) redirect("/login?callbackUrl=/admin/collections/new");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">New collection</h1>
      <div className="mt-6">
        <CollectionForm mode="create" />
      </div>
    </div>
  );
}

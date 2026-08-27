import { redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/auth/session";
import { getAdminSettingsSnapshot } from "@/lib/db/queries/settings";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings" };

/**
 * Store settings (CLAUDE.md §9 / PROMPTS.md Phase 7 item 6) — free-shipping threshold, store
 * address, GSTIN, contact details, announcement-bar text, maintenance banner toggle. Read through
 * `lib/db/queries/settings.ts`'s `getAdminSettingsSnapshot` — the one typed helper every settings
 * read in this codebase now goes through.
 */
export default async function AdminSettingsPage() {
  const session = await requireStaffOrAdmin();
  if (!session.ok) redirect("/login?callbackUrl=/admin/settings");

  const settings = await getAdminSettingsSnapshot();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink-2">Read and written through one place (settings table) — nothing here is a hardcoded literal elsewhere in the app.</p>
      <div className="mt-6">
        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/queries/users";
import { ProfileForm } from "@/components/account/ProfileForm";
import { PasswordForm } from "@/components/account/PasswordForm";

export const metadata = { title: "Your profile", robots: { index: false, follow: false } };

export default async function AccountProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const fullUser = await getUserById(user.id);
  if (!fullUser) redirect("/login");

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl font-semibold text-ink">Profile</h1>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-ink-2">Details</h2>
        <ProfileForm initialName={fullUser.name} initialPhone={fullUser.phone} email={fullUser.email} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-ink-2">Password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}

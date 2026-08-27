import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/queries/users";
import { SignOutButton } from "@/components/account/SignOutButton";

/**
 * The redundant, server-side gate for every `/account/*` page (PROMPTS.md Phase 6 item 2/3) —
 * `middleware.ts` is the first gate; this `getSessionUser()` call is the independent re-check that
 * runs even if middleware were somehow bypassed for a direct render of one of these pages. A
 * missing session redirects to `/login` with a `callbackUrl` back to where the visitor was headed.
 */
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const fullUser = await getUserById(user.id);

  const navItems = [
    { href: "/account", label: "Overview" },
    { href: "/account/orders", label: "Orders" },
    { href: "/account/addresses", label: "Addresses" },
    { href: "/account/wishlist", label: "Wishlist" },
    { href: "/account/profile", label: "Profile" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <p className="mb-1 text-sm font-medium text-ink">{fullUser?.name ?? "Your account"}</p>
          <p className="mb-5 truncate text-xs text-ink-2">{fullUser?.email}</p>
          {fullUser && !fullUser.emailVerifiedAt && (
            <p className="mb-5 rounded-md bg-warn/10 px-3 py-2 text-xs text-warn">Your email isn&apos;t verified yet.</p>
          )}
          <nav aria-label="Account" className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 border-t border-line pt-5">
            <SignOutButton />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/auth/session";

export const metadata = { title: "Coming soon" };

/**
 * A deliberate, real stub — not a 404 — for every admin nav item Phase 8 builds
 * (Products/Collections/Coupons/Reviews/Customers/Content — PROMPTS.md Phase 7 item 1's explicit
 * choice). Still behind the same server-side role gate as every other admin page.
 */
export default async function ComingSoonPage({ searchParams }: PageProps<"/admin/coming-soon">) {
  const session = await requireStaffOrAdmin();
  if (!session.ok) redirect("/login?callbackUrl=/admin");

  const { section } = await searchParams;
  const label = typeof section === "string" && section.trim() ? section.trim() : "This section";

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-ink">{label}</h1>
      <p className="mt-3 text-ink-2">
        {label} is scoped for Phase 8 (catalogue, coupons, reviews, customers and content management) and isn&apos;t
        built yet. This page exists deliberately so the sidebar link goes somewhere real instead of 404ing.
      </p>
    </div>
  );
}

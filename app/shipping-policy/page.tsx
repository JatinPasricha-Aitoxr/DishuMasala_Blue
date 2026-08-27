import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPageBySlug } from "@/lib/db/queries/pages";
import { TiptapRenderer } from "@/components/content/TiptapRenderer";

export const metadata: Metadata = { title: "Shipping Policy", alternates: { canonical: "/shipping-policy" } };

export default async function ShippingPolicyPage() {
  const page = await getPublishedPageBySlug("shipping-policy");
  if (!page) notFound();
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{page.title}</h1>
      <div className="mt-8">
        <TiptapRenderer doc={page.body} />
      </div>
    </main>
  );
}

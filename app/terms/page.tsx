import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPageBySlug } from "@/lib/db/queries/pages";
import { TiptapRenderer } from "@/components/content/TiptapRenderer";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

export default async function TermsPage() {
  const page = await getPublishedPageBySlug("terms");
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

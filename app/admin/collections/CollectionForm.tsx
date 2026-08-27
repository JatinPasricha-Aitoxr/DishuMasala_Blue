"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { AdminCollectionRow } from "@/lib/db/queries/admin-collections";
import { createCollectionAction, updateCollectionAction, checkCollectionSlugAvailableAction } from "./actions";

export function CollectionForm({ mode, collection }: { mode: "create" | "edit"; collection?: AdminCollectionRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [title, setTitle] = useState(collection?.title ?? "");
  const [tagline, setTagline] = useState(collection?.tagline ?? "");
  const [priority, setPriority] = useState(collection?.priority ?? 6);
  const [accentToken, setAccentToken] = useState(collection?.accentToken ?? "");
  const [position, setPosition] = useState(collection?.position ?? 0);
  const [seoTitle, setSeoTitle] = useState(collection?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(collection?.seoDescription ?? "");

  async function handleSlugBlur() {
    if (!slug) return;
    const res = await checkCollectionSlugAvailableAction(slug, collection?.id);
    if (!res.available) setError(`The slug "${slug}" is already used by another collection.`);
    else if (error?.startsWith("The slug")) setError(null);
  }

  function handleSave() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const payload = {
        slug,
        title,
        tagline: tagline || null,
        priority,
        accentToken: accentToken || null,
        position,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      };
      const result = mode === "create" ? await createCollectionAction(payload) : await updateCollectionAction(collection!.id, payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotice(result.message);
      if (mode === "create" && "data" in result && result.data) router.push(`/admin/collections/${result.data.id}`);
      else router.refresh();
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      {error && <div role="alert" className="rounded-md border border-crit/30 bg-crit/5 px-4 py-3 text-sm text-crit">{error}</div>}
      {notice && <div role="status" className="rounded-md border border-ok/30 bg-ok/5 px-4 py-3 text-sm text-ok">{notice}</div>}

      <section className="space-y-4 rounded-lg border border-line bg-surface p-5">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-ink">Title</label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="slug" className="mb-1 block text-sm font-medium text-ink">Slug</label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} onBlur={handleSlugBlur} />
        </div>
        <div>
          <label htmlFor="tagline" className="mb-1 block text-sm font-medium text-ink">Tagline</label>
          <Textarea id="tagline" rows={2} value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-medium text-ink">Priority</label>
            <Input id="priority" type="number" min={1} max={99} value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="position" className="mb-1 block text-sm font-medium text-ink">Position</label>
            <Input id="position" type="number" min={0} value={position} onChange={(e) => setPosition(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="accentToken" className="mb-1 block text-sm font-medium text-ink">Accent token</label>
            <Input id="accentToken" value={accentToken} onChange={(e) => setAccentToken(e.target.value)} placeholder="e.g. leaf" />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-line bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-ink">SEO</h2>
        <div>
          <label htmlFor="seoTitle" className="mb-1 block text-sm font-medium text-ink">SEO title</label>
          <Input id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} />
        </div>
        <div>
          <label htmlFor="seoDescription" className="mb-1 block text-sm font-medium text-ink">SEO description</label>
          <Textarea id="seoDescription" rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={200} />
        </div>
      </section>

      <Button type="button" variant="solid-ink" disabled={pending} onClick={handleSave}>
        {mode === "create" ? "Create collection" : "Save changes"}
      </Button>
    </div>
  );
}

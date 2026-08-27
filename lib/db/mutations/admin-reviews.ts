import "server-only";

/**
 * Review moderation writes (PROMPTS.md Phase 8 item 4). Deliberately NOT capable of editing a
 * review's own text — no function here accepts a `title`/`body` update, only a status transition.
 * "Staff can approve or reject only — never edit the text of a customer's review" (PROMPTS.md) is
 * enforced by this module simply having no such capability, not by a UI omission alone.
 *
 * `reviews` has no `reject_reason` column (CLAUDE.md §6's schema contract is fixed and this phase
 * doesn't extend it) — a reject reason is captured in the `audit_log` diff instead, which is
 * exactly what CLAUDE.md §3.6/§9 already requires every admin mutation to write.
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../index";
import { products, reviews } from "../schema";

export interface ModerationResult {
  ok: boolean;
  productId: number;
  productSlug: string;
}

export async function approveReviewDb(id: number, moderatorUserId: number): Promise<ModerationResult | null> {
  const [row] = await db
    .update(reviews)
    .set({ status: "approved", moderatedAt: new Date(), moderatedBy: moderatorUserId })
    .where(eq(reviews.id, id))
    .returning({ productId: reviews.productId });
  if (!row) return null;
  const [product] = await db.select({ slug: products.slug }).from(products).where(eq(products.id, row.productId)).limit(1);
  return { ok: true, productId: row.productId, productSlug: product?.slug ?? "" };
}

export async function rejectReviewDb(id: number, moderatorUserId: number): Promise<ModerationResult | null> {
  const [row] = await db
    .update(reviews)
    .set({ status: "rejected", moderatedAt: new Date(), moderatedBy: moderatorUserId })
    .where(eq(reviews.id, id))
    .returning({ productId: reviews.productId });
  if (!row) return null;
  const [product] = await db.select({ slug: products.slug }).from(products).where(eq(products.id, row.productId)).limit(1);
  return { ok: true, productId: row.productId, productSlug: product?.slug ?? "" };
}

/** Bulk-approves every given review id, returning the distinct set of affected product slugs so
 * the caller can revalidate each one's PDP (rating/AggregateRating) in one pass. */
export async function bulkApproveReviewsDb(ids: number[], moderatorUserId: number): Promise<string[]> {
  if (ids.length === 0) return [];
  const affected = await db
    .update(reviews)
    .set({ status: "approved", moderatedAt: new Date(), moderatedBy: moderatorUserId })
    .where(and(inArray(reviews.id, ids), eq(reviews.status, "pending")))
    .returning({ productId: reviews.productId });

  const productIds = [...new Set(affected.map((r) => r.productId))];
  if (productIds.length === 0) return [];
  const productRows = await db.select({ slug: products.slug }).from(products).where(inArray(products.id, productIds));
  return productRows.map((p) => p.slug);
}

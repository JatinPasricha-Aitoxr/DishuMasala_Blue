import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../index";
import { collections } from "../schema";

export interface CollectionInput {
  slug: string;
  title: string;
  tagline: string | null;
  priority: number;
  accentToken: string | null;
  position: number;
  seoTitle: string | null;
  seoDescription: string | null;
}

export async function createCollectionDb(input: CollectionInput): Promise<number> {
  const [row] = await db.insert(collections).values(input).returning({ id: collections.id });
  return row.id;
}

export async function updateCollectionDb(id: number, input: CollectionInput): Promise<void> {
  await db.update(collections).set(input).where(eq(collections.id, id));
}

import "server-only";

import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "../index";
import { collections } from "../schema";

export interface AdminCollectionRow {
  id: number;
  slug: string;
  title: string;
  tagline: string | null;
  priority: number;
  accentToken: string | null;
  position: number;
  seoTitle: string | null;
  seoDescription: string | null;
}

export async function listAdminCollections(): Promise<AdminCollectionRow[]> {
  return db.select().from(collections).orderBy(asc(collections.priority), asc(collections.position));
}

export async function getAdminCollectionById(id: number): Promise<AdminCollectionRow | null> {
  const [row] = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  return row ?? null;
}

export async function isCollectionSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const conditions = [eq(collections.slug, slug)];
  if (excludeId != null) conditions.push(ne(collections.id, excludeId));
  const [row] = await db.select({ id: collections.id }).from(collections).where(and(...conditions)).limit(1);
  return !!row;
}

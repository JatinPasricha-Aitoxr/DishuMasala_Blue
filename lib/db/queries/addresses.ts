import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { addresses } from "../schema";

export interface AddressRecord {
  id: number;
  userId: number;
  label: string | null;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: Date;
}

/** Every read here is filtered by `userId` from the session — never by address id alone
 * (PROMPTS.md Phase 6 item 3: "never trust an id from the URL"). */
export async function getAddressesForUser(userId: number): Promise<AddressRecord[]> {
  return db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(addresses.createdAt);
}

/** Returns null both when the address doesn't exist and when it belongs to someone else —
 * callers must treat both cases identically (no enumeration of other users' address ids). */
export async function getAddressForUser(addressId: number, userId: number): Promise<AddressRecord | null> {
  const [row] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .limit(1);
  return row ?? null;
}

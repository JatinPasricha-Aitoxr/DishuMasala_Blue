import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../index";
import { pincodeCache } from "../schema";

export interface PincodeCacheRow {
  pincode: string;
  serviceable: boolean;
  codAvailable: boolean;
  etaDays: number | null;
  checkedAt: Date;
}

/** Raw cache read — `lib/shiprocket.ts` applies the TTL check itself so it can tell a "stale
 * cache, refetching" state apart from "no cache row at all". */
export async function getPincodeCache(pincode: string): Promise<PincodeCacheRow | null> {
  const [row] = await db.select().from(pincodeCache).where(eq(pincodeCache.pincode, pincode)).limit(1);
  return row ?? null;
}

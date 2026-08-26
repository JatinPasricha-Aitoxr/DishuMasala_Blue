import "server-only";

import { db } from "../index";
import { pincodeCache } from "../schema";

export interface UpsertPincodeCacheInput {
  pincode: string;
  serviceable: boolean;
  codAvailable: boolean;
  etaDays: number | null;
}

/** Writes/refreshes one `pincode_cache` row — `checked_at` always bumps to now, so
 * `lib/shiprocket.ts`'s TTL check is measuring "how long ago did we actually check", not the
 * original insert time. */
export async function upsertPincodeCache(input: UpsertPincodeCacheInput): Promise<void> {
  await db
    .insert(pincodeCache)
    .values({ ...input, checkedAt: new Date() })
    .onConflictDoUpdate({
      target: pincodeCache.pincode,
      set: {
        serviceable: input.serviceable,
        codAvailable: input.codAvailable,
        etaDays: input.etaDays,
        checkedAt: new Date(),
      },
    });
}

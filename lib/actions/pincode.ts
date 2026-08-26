"use server";

import { z } from "zod";
import { checkPincodeServiceability, type ServiceabilityResult } from "@/lib/shiprocket";

const pincodeSchema = z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode");

export type PincodeCheckResult =
  | { ok: true; result: ServiceabilityResult }
  | { ok: false; error: string };

/** Server action behind `components/pdp/PincodeCheck.tsx`. Zod-validates the pincode shape, then
 * delegates to lib/shiprocket.ts's cached serviceability check. Never throws to the client. */
export async function checkPincodeAction(pincode: string): Promise<PincodeCheckResult> {
  const parsed = pincodeSchema.safeParse(pincode);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid 6-digit pincode" };
  }

  const result = await checkPincodeServiceability(parsed.data);
  return { ok: true, result };
}

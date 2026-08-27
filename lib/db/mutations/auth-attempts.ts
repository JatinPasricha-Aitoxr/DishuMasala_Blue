import "server-only";

import { db } from "../index";
import { authAttempts } from "../schema";

export async function recordAuthAttempt(action: string, identifierHash: string): Promise<void> {
  await db.insert(authAttempts).values({ action, identifierHash });
}

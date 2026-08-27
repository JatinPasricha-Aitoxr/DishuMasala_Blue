/**
 * Operational script — NOT part of `pnpm db:seed` and deliberately kept out of scripts/seed.ts.
 * scripts/seed.ts is constrained (CLAUDE.md §7.6/§8, PROMPTS.md Phase 0 item 6) to never invent
 * customers, reviews, orders or stock — that constraint is about fabricating FAKE business data.
 * This script does the opposite: it creates a REAL, operator-provided staff/admin account from
 * credentials the caller supplies (never invented here), the same way a sysadmin would run
 * `createsuperuser` for a Django app. No admin/staff account exists anywhere until this is run
 * (Phase 6's tests created one via a direct SQL insert inside test setup only — not a standing
 * account).
 *
 * Usage:
 *   pnpm create-staff-user --email=you@dishumasala.com --password='a-real-password' --name="Staff Name" [--role=admin]
 *   or via env vars: STAFF_EMAIL / STAFF_PASSWORD / STAFF_NAME / STAFF_ROLE
 *
 * Idempotent: re-running with the same email updates that user's password/role/name rather than
 * erroring or duplicating a row (an operator re-running this to rotate a password is the whole
 * point).
 */
import { hash } from "@node-rs/argon2";
import { closeScriptDb, scriptDb, eq } from "../lib/db/script-client";
import { users } from "../lib/db/schema";

// Same Argon2id hashing as lib/auth/password.ts#hashPassword — duplicated here (not imported)
// because that module starts with `import "server-only"`, which throws unconditionally outside
// Next.js's "react-server" bundler condition; a plain tsx/Node script (like scripts/seed.ts's own
// lib/db/script-client.ts) never has that condition. See lib/auth/password.ts's own comment for
// why `2` is Argon2id specifically.
const ARGON2ID = 2;
async function hashPassword(password: string): Promise<string> {
  return hash(password, { algorithm: ARGON2ID });
}

function parseArgs(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([a-zA-Z-]+)=(.*)$/);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const email = (args.email ?? process.env.STAFF_EMAIL ?? "").trim().toLowerCase();
  const password = args.password ?? process.env.STAFF_PASSWORD ?? "";
  const name = (args.name ?? process.env.STAFF_NAME ?? "").trim();
  const role = (args.role ?? process.env.STAFF_ROLE ?? "staff").trim();

  if (!email || !email.includes("@")) {
    throw new Error("A real --email (or STAFF_EMAIL) is required.");
  }
  if (!password || password.length < 8) {
    throw new Error("A --password (or STAFF_PASSWORD) of at least 8 characters is required.");
  }
  if (!name) {
    throw new Error("A --name (or STAFF_NAME) is required.");
  }
  if (role !== "staff" && role !== "admin") {
    throw new Error(`--role must be "staff" or "admin", got "${role}".`);
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  const existing = await scriptDb.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (existing[0]) {
    await scriptDb
      .update(users)
      .set({ passwordHash, name, role: role as "staff" | "admin", emailVerifiedAt: now, updatedAt: now })
      .where(eq(users.id, existing[0].id));
    console.log(`Updated existing user ${email} -> role "${role}".`);
  } else {
    await scriptDb.insert(users).values({ email, name, passwordHash, role: role as "staff" | "admin", emailVerifiedAt: now });
    console.log(`Created ${role} user ${email}.`);
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => closeScriptDb());

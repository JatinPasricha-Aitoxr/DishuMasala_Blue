/**
 * A DB client for standalone Node scripts (scripts/seed.ts, scripts/migrate-images.ts) — run via
 * `tsx`, outside of Next.js's React Server Component context. It deliberately does NOT
 * `import "server-only"` (that package throws unconditionally outside the "react-server" bundler
 * condition, which a plain tsx/Node process never has) and deliberately does NOT reuse
 * lib/db/index.ts's neon-serverless `Pool`, which talks to Postgres over a Neon-proxied
 * WebSocket and has no local/Docker-Postgres equivalent without Neon's separate wsproxy sidecar.
 *
 * Scripts have none of the deployed app's serverless-connection-limit concerns — they are
 * one-off, long-lived Node processes — so a plain `pg` connection (wire-compatible with Neon and
 * with any other Postgres, local Docker included) is the right tool here. This file still lives
 * under lib/db/ so the "no drizzle-orm import outside lib/db/" ESLint rule holds without an
 * exception: scripts import the constructed `db` from here, never drizzle-orm directly. The `eq`
 * re-export below exists for the same reason — a script that needs a `where` clause imports it
 * from here instead of reaching for `drizzle-orm` itself.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export { eq, sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

const pool = new Pool({ connectionString: databaseUrl });

export const scriptDb = drizzle(pool, { schema });

export async function closeScriptDb(): Promise<void> {
  await pool.end();
}

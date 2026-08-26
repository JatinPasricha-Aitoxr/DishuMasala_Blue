import "server-only";

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// The Node runtime on Vercel and Node 20 don't reliably ship a global WebSocket implementation
// (Node only stabilised it in later 22.x releases), and this app must also run under plain
// PM2 + Nginx (CLAUDE.md §10) — so always provide the `ws` polyfill rather than relying on the
// environment to have one. Pool-based (not neon-http) so real multi-statement transactions work,
// which checkout's stock/coupon/order-insert atomicity requires (CLAUDE.md §7.5).
neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });
export type Database = typeof db;

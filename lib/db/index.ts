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

// Local development against a plain (non-Neon) Postgres — e.g. a Docker Postgres used before a
// real Neon project exists — needs Neon's local wsproxy sidecar
// (`ghcr.io/neondatabase/wsproxy`) in front of it, since the serverless driver otherwise only
// speaks to Neon's own proxy (see Neon's docs: "Connect with the serverless driver from a local
// environment"). This activates ONLY when DATABASE_URL points at localhost/127.0.0.1; any real
// Neon host (production, or a Neon dev branch) is untouched.
const dbHost = new URL(databaseUrl.replace(/^postgres(ql)?:/, "http:")).hostname;
if (dbHost === "localhost" || dbHost === "127.0.0.1") {
  const proxyPort = process.env.NEON_LOCAL_WS_PROXY_PORT ?? "4444";
  neonConfig.wsProxy = (host) => `${host}:${proxyPort}/v1`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}

const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });
export type Database = typeof db;

import { existsSync } from "node:fs";

/**
 * Vitest doesn't load `.env` itself the way `pnpm dev`/`tsx --env-file-if-exists` do. Most existing
 * integration tests (tests/integration/{checkout-integrity,payment-race}.test.ts) only need
 * `DATABASE_URL` for a raw `pg` client they construct themselves mid-test, so they each guard-load
 * it inline. Phase 6's tests instead import real `lib/db/*` modules statically (to call the actual
 * mutation/query functions, not re-implement them against raw SQL) — those modules read
 * `process.env.DATABASE_URL` at module-load time, which happens before any in-file top-level code
 * could run (ES module imports are hoisted). Vitest's `setupFiles` run before a test file's own
 * module graph is resolved, so loading `.env` here — once, for every test file — makes it available
 * in time. Guarded the same way the other tests already are: a no-op if DATABASE_URL is already set
 * (e.g. in CI) or `.env` doesn't exist.
 */
if (!process.env.DATABASE_URL && existsSync(".env")) {
  process.loadEnvFile(".env");
}

// Vitest runs in plain Node, not under Next's "react-server" build condition, so the real
// `server-only` package (which unconditionally throws unless resolved via that condition) would
// throw on every import of a `lib/db/*` module. Existing tests avoided this by only talking to
// Postgres through a raw `pg` client; Phase 6's integration tests instead call the real
// `lib/db/mutations`/`lib/db/queries` functions directly, so vitest.config.ts aliases the
// `server-only` import to this no-op stub — test-only, never part of the app's own build.
export {};

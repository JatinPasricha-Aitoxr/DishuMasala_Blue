import "server-only";

/**
 * Password hashing (CLAUDE.md §2 / PROMPTS.md Phase 6 item 1): Argon2id, never bcrypt, never a
 * reversible encryption. `@node-rs/argon2` is a native binding (not edge-safe), so this module is
 * only ever imported from Node-runtime code (auth.ts's Credentials authorize, server actions) —
 * never from auth.config.ts, which middleware.ts (edge) imports.
 */
import { hash, verify } from "@node-rs/argon2";

// `@node-rs/argon2` declares `Algorithm` as an *ambient* `const enum`, which TypeScript can't
// reference under this project's `isolatedModules: true` (each file is transpiled independently,
// so a const enum's members — normally inlined at compile time — aren't resolvable from a
// `.d.ts`-only ambient declaration). `2` is that enum's own `Argon2id` value
// (node_modules/@node-rs/argon2/index.d.ts: Argon2d = 0, Argon2i = 1, Argon2id = 2) — Argon2id
// explicitly, never bcrypt, never a reversible encryption (CLAUDE.md §2). Cost params are left at
// the library's own defaults (19 MiB memory, 2 iterations, 1 thread), themselves
// OWASP-reasonable for a serverless request budget; tuned lower would weaken the hash, tuned much
// higher risks request timeouts on constrained serverless CPU.
const ARGON2ID = 2;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, { algorithm: ARGON2ID });
}

export async function verifyPasswordHash(hashedPassword: string, password: string): Promise<boolean> {
  try {
    return await verify(hashedPassword, password, { algorithm: ARGON2ID });
  } catch {
    // A malformed/foreign hash format — never throw into a login flow, just treat as no match.
    return false;
  }
}

/**
 * Burns roughly the same amount of CPU time as a real `verifyPasswordHash` call, for the
 * "unregistered email" branch of login (PROMPTS.md Phase 6 item 1: "don't let a fast-path
 * short-circuit on 'email not found' create a timing oracle"). Exact timing-attack resistance is
 * a stretch goal per the brief; this closes the obvious gap (DB lookup miss + no hash at all vs.
 * DB lookup hit + a real Argon2 verify) without adding real complexity.
 */
const DUMMY_HASH_PROMISE = hashPassword("dishu-masala-timing-decoy-password");
export async function burnPasswordVerifyTime(): Promise<void> {
  const dummyHash = await DUMMY_HASH_PROMISE;
  await verifyPasswordHash(dummyHash, "not-the-real-password");
}

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * The first gate for `/account/*` and `/admin/*` (CLAUDE.md §2 / PROMPTS.md Phase 6 item 2) — NOT
 * the only one. `authConfig.callbacks.authorized` (auth.config.ts) does the actual role check;
 * every server action and route handler behind these paths independently re-verifies the session
 * itself (see each file's doc comment for exactly where), because middleware can be bypassed by
 * calling a server action directly (e.g. from a test, or a malicious client) without ever hitting
 * this matcher's page route.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { getUserByEmail } from "@/lib/db/queries/users";
import { markLastLogin } from "@/lib/db/mutations/users";
import { verifyPasswordHash, burnPasswordVerifyTime } from "@/lib/auth/password";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

/**
 * Node-runtime half of Auth.js v5 (CLAUDE.md §2 / PROMPTS.md Phase 6 item 1). Only this file (and
 * anything it imports) ever touches `@node-rs/argon2` or `lib/db` — `auth.config.ts` stays
 * edge-safe for `middleware.ts`.
 *
 * `authorize` is where login's rate limiting and "generic error, no enumeration" rules live
 * (PROMPTS.md item 1): a wrong password for a real email and a login attempt for a nonexistent
 * email both (a) get rate-limited identically by IP+email, (b) run a real-shaped amount of work
 * (a genuine Argon2 verify, or a decoy one via `burnPasswordVerifyTime` when there's no user/hash
 * to check against) so a fast DB-miss can't be timed apart from a slow hash-mismatch, and (c)
 * return `null` either way — NextAuth turns that into the same generic
 * `CredentialsSignin` error for both cases, never "no such user" vs "wrong password".
 */
const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials, request) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip = clientIpFromHeaders(request.headers);
        const { allowed } = await checkRateLimit("login", { ip, email });
        if (!allowed) {
          // Thrown errors surface as a distinct NextAuth error code, which is fine to distinguish
          // from "wrong credentials" — a rate-limit message doesn't leak whether the email exists.
          throw new Error("rate_limited");
        }

        const user = await getUserByEmail(email);
        if (!user) {
          await burnPasswordVerifyTime();
          return null;
        }

        const valid = await verifyPasswordHash(user.passwordHash, password);
        if (!valid) return null;

        await markLastLogin(user.id);

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});

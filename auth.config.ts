import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the Auth.js v5 config (CLAUDE.md §2 / PROMPTS.md Phase 6 items 1-2). This
 * file must never import anything that isn't edge-runtime-safe — no `@node-rs/argon2` (a native
 * binding), no `lib/db` (the Neon Pool driver's own reasons, see lib/db/index.ts). It holds only
 * the `authorized` callback (used by `middleware.ts`, which runs on the edge) and the JWT/session
 * shape callbacks. The Credentials provider itself — which does need argon2 + the DB — is added
 * only in `auth.ts` (Node runtime), spread on top of this config.
 *
 * `authorized` is the middleware gate (PROMPTS.md Phase 6 item 2): `/admin/*` requires role
 * `staff` or `admin`; `/account/*` requires any signed-in user. This is explicitly the FIRST
 * gate, not the only one — every server action/route handler this phase touches independently
 * re-verifies the session itself (see each action's own doc comment for where).
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;
      const isSignedIn = Boolean(auth?.user);

      if (pathname.startsWith("/admin")) {
        return isSignedIn && (role === "staff" || role === "admin");
      }
      if (pathname.startsWith("/account")) {
        return isSignedIn;
      }
      return true;
    },
    jwt({ token, user }) {
      // `next-auth/jwt`'s `JWT` type comes from `@auth/core`, which isn't independently
      // resolvable for a `declare module` augmentation under this repo's pnpm layout (it's only
      // ever reached transitively, and `skipLibCheck` covers that path but not an explicit
      // augmentation) — so the extra fields are carried via this narrow, local cast instead of a
      // global module augmentation. `token` itself is still the real object NextAuth persists
      // into the session cookie; this only affects how TypeScript sees it here.
      const t = token as typeof token & { userId?: number; role?: "customer" | "staff" | "admin" };
      if (user) {
        t.userId = Number(user.id);
        t.role = (user as { role?: "customer" | "staff" | "admin" }).role ?? "customer";
      }
      return t;
    },
    session({ session, token }) {
      const t = token as typeof token & { userId?: number; role?: "customer" | "staff" | "admin" };
      if (session.user) {
        session.user.id = String(t.userId ?? "");
        session.user.role = t.role ?? "customer";
      }
      return session;
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "customer" | "staff" | "admin";
      name?: string | null;
      email?: string | null;
    };
  }
  interface User {
    role?: "customer" | "staff" | "admin";
  }
}

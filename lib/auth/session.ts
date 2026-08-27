import "server-only";

import { auth } from "@/auth";

export interface SessionUser {
  id: number;
  role: "customer" | "staff" | "admin";
}

/**
 * The redundant, independent authorization check every account/admin server action and route
 * handler must call itself (CLAUDE.md §9 / PROMPTS.md Phase 6 item 2: "Middleware is the first
 * gate, not the only one"). `middleware.ts` never runs for a server action invoked directly
 * (e.g. a test calling the exported function, or any caller that isn't a page navigation through
 * the matcher), so every one of these functions re-derives the session from the request's own
 * cookies via `auth()` rather than trusting that middleware already ran.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const id = Number(session.user.id);
  if (!Number.isFinite(id)) return null;
  return { id, role: session.user.role };
}

export type RequireResult = { ok: true; user: SessionUser } | { ok: false; error: "unauthenticated" | "forbidden" };

/** Any signed-in user — the gate behind every `/account/*` action. */
export async function requireUser(): Promise<RequireResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  return { ok: true, user };
}

/** `staff` or `admin` only — the gate behind every `/admin/*` action (Phase 7+, wired now so
 * Phase 6's tests can prove the gate itself works ahead of any real admin page existing). */
export async function requireStaffOrAdmin(): Promise<RequireResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  if (user.role !== "staff" && user.role !== "admin") return { ok: false, error: "forbidden" };
  return { ok: true, user };
}

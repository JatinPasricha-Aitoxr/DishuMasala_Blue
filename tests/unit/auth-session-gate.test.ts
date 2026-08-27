import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Direct proof of PROMPTS.md Phase 6's acceptance criterion: "/admin is unreachable as a
 * customer — including by calling the server actions directly... prove that directly invoking
 * the underlying server action/route handler as an authenticated-but-wrong-role customer is
 * independently rejected." `requireUser`/`requireStaffOrAdmin` (lib/auth/session.ts) are exactly
 * that redundant check — every /account and /admin server action this phase (and every future
 * admin action in Phase 7) calls one of these itself, never relying on middleware.ts having
 * already run. This test calls them directly, with `auth()` mocked to hand back a real-shaped
 * session for each role, completely bypassing middleware/the page router — the same bypass a
 * malicious or buggy caller invoking the action directly (e.g. from devtools, or a test) would
 * take.
 */
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => mockAuth() }));

describe("lib/auth/session.ts — the redundant server-side gate", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("requireUser rejects when signed out", async () => {
    mockAuth.mockResolvedValue(null);
    const { requireUser } = await import("@/lib/auth/session");
    const result = await requireUser();
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
  });

  it("requireUser accepts any signed-in role", async () => {
    mockAuth.mockResolvedValue({ user: { id: "42", role: "customer" } });
    const { requireUser } = await import("@/lib/auth/session");
    const result = await requireUser();
    expect(result).toEqual({ ok: true, user: { id: 42, role: "customer" } });
  });

  it("requireStaffOrAdmin rejects when signed out", async () => {
    mockAuth.mockResolvedValue(null);
    const { requireStaffOrAdmin } = await import("@/lib/auth/session");
    const result = await requireStaffOrAdmin();
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
  });

  it("requireStaffOrAdmin REJECTS an authenticated customer-role session (the exact case this criterion is about)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "7", role: "customer" } });
    const { requireStaffOrAdmin } = await import("@/lib/auth/session");
    const result = await requireStaffOrAdmin();
    expect(result).toEqual({ ok: false, error: "forbidden" });
  });

  it("requireStaffOrAdmin accepts a staff-role session", async () => {
    mockAuth.mockResolvedValue({ user: { id: "8", role: "staff" } });
    const { requireStaffOrAdmin } = await import("@/lib/auth/session");
    const result = await requireStaffOrAdmin();
    expect(result).toEqual({ ok: true, user: { id: 8, role: "staff" } });
  });

  it("requireStaffOrAdmin accepts an admin-role session", async () => {
    mockAuth.mockResolvedValue({ user: { id: "9", role: "admin" } });
    const { requireStaffOrAdmin } = await import("@/lib/auth/session");
    const result = await requireStaffOrAdmin();
    expect(result).toEqual({ ok: true, user: { id: 9, role: "admin" } });
  });
});

/**
 * Same proof at the middleware layer (auth.config.ts's `authorized` callback) — this is literally
 * the function middleware.ts runs as the FIRST gate; it's tested directly here (not via an HTTP
 * round trip) to pin its exact behaviour per role/path independent of the redundant checks above.
 */
describe("auth.config.ts — the authorized callback (middleware's first gate)", () => {
  it("blocks /admin for a signed-out visitor", async () => {
    const { authConfig } = await import("@/auth.config");
    const authorized = authConfig.callbacks!.authorized!;
    const result = await authorized({
      auth: null,
      request: { nextUrl: new URL("http://localhost/admin") } as never,
    } as never);
    expect(result).toBe(false);
  });

  it("blocks /admin for a customer-role session", async () => {
    const { authConfig } = await import("@/auth.config");
    const authorized = authConfig.callbacks!.authorized!;
    const result = await authorized({
      auth: { user: { id: "1", role: "customer" } } as never,
      request: { nextUrl: new URL("http://localhost/admin/orders") } as never,
    } as never);
    expect(result).toBe(false);
  });

  it("allows /admin for a staff-role session", async () => {
    const { authConfig } = await import("@/auth.config");
    const authorized = authConfig.callbacks!.authorized!;
    const result = await authorized({
      auth: { user: { id: "1", role: "staff" } } as never,
      request: { nextUrl: new URL("http://localhost/admin") } as never,
    } as never);
    expect(result).toBe(true);
  });

  it("blocks /account for a signed-out visitor but allows any signed-in role", async () => {
    const { authConfig } = await import("@/auth.config");
    const authorized = authConfig.callbacks!.authorized!;
    expect(
      await authorized({ auth: null, request: { nextUrl: new URL("http://localhost/account") } as never } as never),
    ).toBe(false);
    expect(
      await authorized({
        auth: { user: { id: "1", role: "customer" } } as never,
        request: { nextUrl: new URL("http://localhost/account") } as never,
      } as never),
    ).toBe(true);
  });
});

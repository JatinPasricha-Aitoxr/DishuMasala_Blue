import { test, expect } from "@playwright/test";

/**
 * Real end-to-end proof of PROMPTS.md Phase 6's first acceptance criterion: "Register → verify →
 * login → logout → password reset → session refresh, all working end to end" — driven through the
 * actual UI, not described. No Resend account exists in this environment, so
 * app/api/testing/auth-tokens/route.ts (NODE_ENV-production-blocked, same pattern as the existing
 * Razorpay mock) mints the exact same signed tokens the real verification/reset emails would have
 * linked to, standing in only for "check your inbox" — everything else (the DB writes, the
 * Argon2id hashing, the session cookie, the redirect gates) is the real app.
 */
test("register → verify → login → logout → reset → session refresh", async ({ page, request }) => {
  const suffix = Date.now();
  const email = `e2e-auth-${suffix}@example.com`;
  const password = "correct-horse-battery-1";
  const newPassword = "correct-horse-battery-2";

  // ---- Register ---------------------------------------------------------------------------
  await page.goto("/register");
  await page.getByLabel("Name").fill("Auth E2E Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/login\?registered=1/);
  await expect(page.getByText(/check your email for a verification link/i)).toBeVisible();

  // ---- Verify (via the test-only token mint, standing in for the email link) -------------
  const tokenRes = await request.post("/api/testing/auth-tokens", { data: { email } });
  expect(tokenRes.ok()).toBe(true);
  const { verifyToken, resetToken } = (await tokenRes.json()) as { verifyToken: string; resetToken: string };

  await page.goto(`/verify-email?token=${encodeURIComponent(verifyToken)}`);
  await expect(page.getByRole("heading", { name: /email verified/i })).toBeVisible();

  // ---- Login --------------------------------------------------------------------------------
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account\/?$/);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

  // Session refresh: a fresh navigation to a protected page stays signed in (the cookie is real,
  // not just client-side React state) — this is the "session refresh" half of the criterion.
  await page.goto("/account/profile");
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue(email);

  // ---- Logout ---------------------------------------------------------------------------------
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login/); // signed out again — /account is unreachable

  // ---- Password reset --------------------------------------------------------------------------
  await page.goto(`/reset-password?token=${encodeURIComponent(resetToken)}`);
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirm new password").fill(newPassword);
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page).toHaveURL(/\/login\?reset=1/);

  // Old password no longer works, new one does.
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Password").fill(newPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account\/?$/);
});

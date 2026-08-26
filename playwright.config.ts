import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config (PROMPTS.md Phase 3 item 7 is the first phase to need this — no config
 * existed before). Points at the already-running local dev server (CLAUDE.md's dev environment
 * note: `pnpm dev` may already be up on :3000) rather than starting a second one — `webServer` is
 * configured with `reuseExistingServer: true` so `pnpm test:e2e` still works standalone in CI or a
 * fresh checkout, without erroring on "port in use" here.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

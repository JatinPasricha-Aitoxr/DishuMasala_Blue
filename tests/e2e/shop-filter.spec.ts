import { test, expect } from "@playwright/test";

/**
 * PROMPTS.md Phase 3 item 7's explicit E2E scenario: filter the shop to the Blue Tea collection,
 * assert exactly 2 products render, assert the resulting URL carries the filter as a query param,
 * reload the page, assert the filter survived the reload — i.e. it's really URL-state-driven, not
 * client memory. Runs with JavaScript enabled (Playwright's default) as a normal end-to-end
 * check; the harder "does this work with NO JavaScript at all" proof was verified separately with
 * `javaScriptEnabled: false` against the real dev server as part of this phase's manual
 * acceptance-criteria pass (see the self-report) — Playwright's own test runner needs JS for its
 * own instrumentation, so that specific check isn't expressible as a `@playwright/test` spec.
 */
test.describe("Shop collection filter", () => {
  test("filtering to Blue Tea shows exactly 2 products and survives a reload via the URL", async ({ page }) => {
    await page.goto("/shop");

    await page.locator('#shop-filters-desktop input[name="collection"][value="blue-tea"]').check();
    await page.locator('#shop-filters-desktop button[type="submit"]').click();

    await expect(page).toHaveURL(/[?&]collection=blue-tea(&|$)/);

    const productLinks = page.locator('ul a[aria-label][href^="/product/"]');
    await expect(productLinks).toHaveCount(2);
    await expect(page.getByText(/^2 products?/)).toBeVisible();

    // Reload — if the filter only lived in client state (not the URL), it would reset to all 20.
    await page.reload();
    await expect(page).toHaveURL(/[?&]collection=blue-tea(&|$)/);
    await expect(productLinks).toHaveCount(2);
  });

  test("sorting persists in the URL and survives a reload", async ({ page }) => {
    await page.goto("/shop");
    await page.selectOption("#shop-sort", "price-desc");
    await expect(page).toHaveURL(/[?&]sort=price-desc(&|$)/);

    await page.reload();
    await expect(page).toHaveURL(/[?&]sort=price-desc(&|$)/);
    await expect(page.locator("#shop-sort")).toHaveValue("price-desc");
  });

  test("clearing filters returns to the unfiltered 20-product shop", async ({ page }) => {
    await page.goto("/shop?collection=blue-tea");
    await expect(page.locator('ul a[aria-label][href^="/product/"]')).toHaveCount(2);

    await page.getByRole("link", { name: "Clear all" }).first().click();
    await expect(page).toHaveURL(/\/shop\/?$/);
    await expect(page.locator('ul a[aria-label][href^="/product/"]')).toHaveCount(20);
  });
});

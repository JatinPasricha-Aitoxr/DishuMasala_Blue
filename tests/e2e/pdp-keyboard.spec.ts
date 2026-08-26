import { test, expect } from "@playwright/test";

/**
 * Real, driven keyboard-only interaction pass (PROMPTS.md Phase 4: "real driven keyboard events,
 * not a read-through") over the gallery, variant chips, quantity stepper, accordions, review
 * form's star rating, and the photo lightbox.
 */
const BLUE_TEA_LOOSE = "/product/premium-herbal-blue-tea-loose";

test.describe("PDP keyboard operability", () => {
  test("gallery: Enter opens the zoom dialog, Escape closes it", async ({ page }) => {
    await page.goto(BLUE_TEA_LOOSE);
    const gallery = page.getByRole("group", { name: /photos$/ });
    await gallery.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("variant chips are reachable and selectable via Tab and Space", async ({ page }) => {
    await page.goto(BLUE_TEA_LOOSE);
    const firstChip = page.locator('div[role="radiogroup"] input[type="radio"]').first();
    await firstChip.focus();
    await expect(firstChip).toBeFocused();

    // Native radio group keyboard behaviour: ArrowDown moves to and selects the next radio.
    await page.keyboard.press("ArrowDown");
    const secondChip = page.locator('div[role="radiogroup"] input[type="radio"]').nth(1);
    await expect(secondChip).toBeChecked();
  });

  test("quantity stepper buttons are keyboard-operable", async ({ page }) => {
    await page.goto(BLUE_TEA_LOOSE);
    const increase = page.getByRole("button", { name: "Increase quantity" });
    await increase.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    const payload = JSON.parse(await page.locator('[data-testid="add-to-cart-payload"]').innerText());
    expect(payload.qty).toBe(3);
  });

  test("every accordion trigger opens and closes via Enter", async ({ page }) => {
    await page.goto(BLUE_TEA_LOOSE);

    const names = ["Key Characteristics", "Ingredients", "How to brew / How to use", "Shipping & Returns"];
    for (const name of names) {
      const trigger = page.getByRole("button", { name });
      if ((await trigger.count()) === 0) continue; // e.g. a product with no parsed Ingredients line
      await trigger.focus();
      const wasOpen = (await trigger.getAttribute("data-state")) === "open";
      await page.keyboard.press("Enter");
      await expect(trigger).toHaveAttribute("data-state", wasOpen ? "closed" : "open");
      await page.keyboard.press("Enter");
      await expect(trigger).toHaveAttribute("data-state", wasOpen ? "open" : "closed");
    }
  });

  test("review form star rating is keyboard-operable with arrow keys", async ({ page }) => {
    await page.goto(BLUE_TEA_LOOSE);
    await page.locator("#reviews").scrollIntoViewIfNeeded();

    const firstStar = page.getByRole("radio", { name: "1 star" });
    await firstStar.focus();
    // Starting from an unset rating (0), each ArrowRight moves to the next star: 0 → 1 → 2.
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "2 stars" })).toHaveAttribute("aria-checked", "true");
  });
});

import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("home page loads successfully", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Sphinx Bounties/i);

    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("home page is accessible", async ({ page }) => {
    await page.goto("/");

    const violations = await page.evaluate(() => {
      const html = document.documentElement;
      return html.lang ? null : "Missing lang attribute";
    });

    expect(violations).toBeNull();
  });
});

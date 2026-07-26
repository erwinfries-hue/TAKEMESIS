import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home page renders the TEKMESIS brand claim", async ({ page }) => {
  await page.goto("/");
  // Scoped to the header link, not exact-text — the "why not ChatGPT"
  // comparison table's TEKMESIS column header also matches "TEKMESIS".
  await expect(page.getByRole("link", { name: "TEKMESIS", exact: true })).toBeVisible();
  await expect(page.getByText("FROM STUDIES TO CLARITY.")).toBeVisible();
});

test("a skip-to-content link is the first focusable element and jumps past the header nav", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Zum Inhalt springen" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveAttribute("href", "#main-content");
});

test("locale switcher toggles between DE and EN", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("home page has no critical accessibility violations @a11y", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

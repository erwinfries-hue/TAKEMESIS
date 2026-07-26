import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("unauthenticated /admin redirects to /admin/login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Admin-Login" })).toBeVisible();
});

test("login with wrong credentials shows an error and does not grant access", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("E-Mail").fill("admin@tekmesis.com");
  await page.getByLabel("Zugangscode").fill("wrong-secret");
  await page.getByRole("button", { name: "Anmelden" }).click();

  await expect(page).toHaveURL(/\/admin\/login\?error=1$/);
  await expect(page.getByText(/Ungültige E-Mail-Adresse/)).toBeVisible();
});

test("login with correct credentials reaches the admin overview (no live database configured here)", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("E-Mail").fill("admin@tekmesis.com");
  await page.getByLabel("Zugangscode").fill("e2e-test-secret");
  await page.getByRole("button", { name: "Anmelden" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Admin-Übersicht" })).toBeVisible();
  // No Supabase project exists in this environment — the page must degrade
  // gracefully, not crash.
  await expect(page.getByText(/Datenbank nicht verbunden/)).toBeVisible();
  await expect(page.getByText("admin@tekmesis.com")).toBeVisible();

  await page.getByRole("link", { name: "Zahlungen" }).click();
  await expect(page).toHaveURL(/\/admin\/payments$/);
  await expect(page.getByRole("heading", { name: "Zahlungen" })).toBeVisible();
});

test("logout clears the session and /admin requires login again", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("E-Mail").fill("admin@tekmesis.com");
  await page.getByLabel("Zugangscode").fill("e2e-test-secret");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("button", { name: "Abmelden" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("admin login page has no critical accessibility violations @a11y", async ({ page }) => {
  await page.goto("/admin/login");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("admin overview page (authenticated) has no critical accessibility violations @a11y", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("E-Mail").fill("admin@tekmesis.com");
  await page.getByLabel("Zugangscode").fill("e2e-test-secret");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Admin-Übersicht" })).toBeVisible();
  // Client-side navigation can render the page body before the App
  // Router commits the route's <title> to <head> — waiting on the heading
  // alone isn't enough; explicitly wait for the title too, otherwise axe can
  // sample the DOM mid-transition and flag a false "document-title" violation.
  await expect(page).toHaveTitle("Admin — TEKMESIS");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

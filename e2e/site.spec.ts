import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const contentPages = [
  { path: "/topics", heading: "Themen entdecken" },
  { path: "/example-report", heading: "Beispiel-Report" },
  { path: "/methodology", heading: "Methodik" },
  { path: "/sources", heading: "Quellen & Datenbanken" },
  { path: "/privacy", heading: "Datenschutz" },
  { path: "/legal", heading: "Impressum & AGB" },
  { path: "/about", heading: "Über TEKMESIS" },
  { path: "/checkout/success", heading: "Danke für deine Zahlung" },
  { path: "/checkout/cancel", heading: "Zahlung abgebrochen" },
];

for (const { path, heading } of contentPages) {
  test(`${path} renders its heading`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  });

  test(`${path} has no critical accessibility violations @a11y`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("main navigation links reach every content page", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
  await expect(nav.getByRole("link", { name: "Themen" })).toHaveAttribute("href", "/topics");
  await expect(nav.getByRole("link", { name: "Methodik" })).toHaveAttribute(
    "href",
    "/methodology",
  );
});

test("topics page shows the elevated-risk badge for Gesundheit & Prävention", async ({
  page,
}) => {
  await page.goto("/topics");
  const section = page.locator("#gesundheit-praevention");
  await expect(section.getByText("Hochrisiko-Unterthemen eingeschränkt")).toBeVisible();
});

test("clicking an example-question chip prefills the own-question form", async ({ page }) => {
  await page.goto("/topics");
  const chip = page
    .locator("#lernen-bildung")
    .getByRole("link", { name: "Welche Lernmethode verbessert den Lernerfolg?" });
  await chip.click();
  await expect(page.getByLabel("Deine Frage")).toHaveValue(
    "Welche Lernmethode verbessert den Lernerfolg?",
  );
});

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
  // No SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY in the e2e webServer env
  // (playwright.config.ts), so this exercises the fail-soft "database
  // unreachable" branch (a graceful notice, not a 500) rather than the
  // "token genuinely doesn't exist" branch, which has its own heading.
  { path: "/report/some-random-token", heading: "Report nicht verfügbar" },
  { path: "/this-page-does-not-exist", heading: "Diese Seite konnten wir nicht finden" },
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

test("an unknown URL returns a real 404 status with a branded not-found page", async ({
  page,
}) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Fehler 404")).toBeVisible();
  await page.getByRole("link", { name: "Zur Startseite" }).click();
  await expect(page).toHaveURL(/\/$/);
});

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

test("example-report preview renders all 9 premium report sections with a clear placeholder-data warning", async ({
  page,
}) => {
  await page.goto("/example-report");

  await expect(
    page.getByText(
      "Alle Studientitel, Autor:innen und Zeitschriften unten sind erfundene Platzhalter",
    ),
  ).toBeVisible();

  for (const heading of [
    "Frage, Umfang & Methode",
    "Evidenzlandschaft",
    "Studienvergleich",
    "Detaillierte Studienprofile",
    "Integrierte Synthese",
    "Evidenzsicherheit",
    "Praktische Einordnung",
    "Offene Fragen & Quellen",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }

  // AI-dependent sections must say so, never show fabricated content.
  await expect(page.getByText("Noch nicht verfügbar").first()).toBeVisible();

  await expect(page.getByRole("button", { name: "Als PDF speichern / drucken" })).toBeVisible();
});

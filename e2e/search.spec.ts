import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("submitting the own-question form on the home page reaches /search with a classification", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Deine Frage")
    .fill("Welche Lernmethode verbessert den Lernerfolg?");
  await page.getByRole("button", { name: "Frage einordnen" }).click();

  await expect(page).toHaveURL(/\/search\?q=/);
  await expect(
    page.getByText("Welche Lernmethode verbessert den Lernerfolg?"),
  ).toBeVisible();
  await expect(page.getByLabel("Lernen & Bildung")).toBeChecked();
});

test("confirming a domain runs the real search pipeline (this sandbox has no network access to the source APIs, so it correctly reaches the search-failed state, not a fake success)", async ({
  page,
}) => {
  await page.goto(
    "/search?q=" + encodeURIComponent("Welche Lernmethode verbessert den Lernerfolg?"),
  );
  await page.getByRole("button", { name: "Bestätigen und Quellen durchsuchen" }).click();

  await expect(page).toHaveURL(/domain=lernen-bildung/);
  await expect(
    page.getByRole("heading", { name: "Die Quellen sind aktuell nicht erreichbar" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Erneut versuchen" })).toHaveAttribute(
    "href",
    /\/search\?q=.*domain=lernen-bildung/,
  );
});

test("a high-risk question is restricted, not classified", async ({ page }) => {
  await page.goto("/search?q=" + encodeURIComponent("Welche Chemotherapie hilft bei Krebs?"));
  await expect(
    page.getByRole("heading", { name: "Diese Frage können wir nicht automatisiert einordnen" }),
  ).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
});

test("a question with no keyword matches falls back to the full topic list", async ({
  page,
}) => {
  await page.goto("/search?q=" + encodeURIComponent("qwertyzzz foobarbaz"));
  await expect(
    page.getByRole("heading", { name: "Wir konnten deine Frage keinem Bereich eindeutig zuordnen" }),
  ).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(12);
});

test("/search without a question prompts to go back to topics", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: "Keine Frage angegeben" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Zurück zu den Themen/ })).toHaveAttribute(
    "href",
    "/topics",
  );
});

for (const [label, query, domain] of [
  ["classification state", "Welche Lernmethode verbessert den Lernerfolg?", undefined],
  ["restricted state", "Welche Chemotherapie hilft bei Krebs?", undefined],
  ["no-question state", "", undefined],
  ["search-failed state", "Welche Lernmethode verbessert den Lernerfolg?", "lernen-bildung"],
] as const) {
  test(`/search (${label}) has no critical accessibility violations @a11y`, async ({ page }) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (domain) params.set("domain", domain);
    const qs = params.toString();
    await page.goto(qs ? `/search?${qs}` : "/search");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

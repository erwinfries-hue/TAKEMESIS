import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { MAX_QUESTION_LENGTH } from "../src/lib/security/limits";

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

test("a question over the character limit is rejected before classification", async ({
  page,
}) => {
  const longQuestion = "a".repeat(MAX_QUESTION_LENGTH + 100);
  await page.goto("/search?q=" + encodeURIComponent(longQuestion));
  await expect(page.getByRole("heading", { name: "Frage zu lang" })).toBeVisible();
});

test("exceeding the daily free-search limit shows the rate-limit notice, not the search pipeline", async ({
  page,
}) => {
  // Unique per run so this test never shares a rate-limit bucket with the
  // other domain-confirmed /search specs above (which send no
  // x-forwarded-for and so land in the "unknown" bucket).
  const uniqueIp = `203.0.113.${Math.floor(Math.random() * 254) + 1}`;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp });
  const url =
    "/search?q=" +
    encodeURIComponent("Welche Lernmethode verbessert den Lernerfolg?") +
    "&domain=lernen-bildung";

  // FREE_SEARCH_LIMIT defaults to 5 — exhaust it, then confirm the next
  // request is blocked instead of reaching the search pipeline.
  for (let i = 0; i < 5; i++) {
    await page.goto(url);
    await expect(
      page.getByRole("heading", { name: "Die Quellen sind aktuell nicht erreichbar" }),
    ).toBeVisible();
  }

  await page.goto(url);
  await expect(
    page.getByRole("heading", { name: "Tageslimit für kostenlose Suchen erreicht" }),
  ).toBeVisible();
});

for (const [label, query, domain] of [
  ["classification state", "Welche Lernmethode verbessert den Lernerfolg?", undefined],
  ["restricted state", "Welche Chemotherapie hilft bei Krebs?", undefined],
  ["no-question state", "", undefined],
  ["search-failed state", "Welche Lernmethode verbessert den Lernerfolg?", "lernen-bildung"],
  ["question-too-long state", "a".repeat(MAX_QUESTION_LENGTH + 100), undefined],
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

test("/search (rate-limited state) has no critical accessibility violations @a11y", async ({
  page,
}) => {
  const uniqueIp = `203.0.113.${Math.floor(Math.random() * 254) + 1}`;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp });
  const url =
    "/search?q=" +
    encodeURIComponent("Welche Lernmethode verbessert den Lernerfolg?") +
    "&domain=lernen-bildung";
  for (let i = 0; i < 5; i++) {
    await page.goto(url);
  }
  await page.goto(url);
  await expect(
    page.getByRole("heading", { name: "Tageslimit für kostenlose Suchen erreicht" }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

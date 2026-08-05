import { test, expect } from "@playwright/test";

test("security headers are present on every response", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
});

test("Permissions-Policy allows the site's own pages to use the microphone (voice input needs this — live bug 2026-08-05: 'microphone=()' silently blocked it for everyone, including same-origin)", async ({
  request,
}) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["permissions-policy"]).toContain("microphone=(self)");
  // Camera/geolocation/payment stay fully blocked — this app never uses them.
  expect(headers["permissions-policy"]).toContain("camera=()");
});

test("the CSP nonce does not break client-side hydration or interactivity, and produces no browser console errors", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto("/");
  // Exercise real client-side interactivity (locale switch triggers a
  // server action + re-render) to catch any CSP-blocked script/style.
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.goto("/topics");
  await page.goto("/search?q=" + encodeURIComponent("test question"));

  expect(consoleErrors).toEqual([]);
});

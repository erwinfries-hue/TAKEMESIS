import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// This sandboxed dev environment pre-installs a full Chromium binary at a
// fixed path (separate from Playwright's own version-pinned browser
// downloads) and disables `playwright install`. Use it only when present;
// CI and other machines fall back to Playwright's normally managed browser.
const sandboxChromiumPath = "/opt/pw-browsers/chromium";
const launchOptions = existsSync(sandboxChromiumPath)
  ? { executablePath: sandboxChromiumPath }
  : undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions,
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Test-only fixed credentials so e2e specs can exercise the admin
      // login flow — not a real secret, never used outside this test server.
      ADMIN_EMAILS: "admin@tekmesis.com",
      ADMIN_AUTH_SECRET: "e2e-test-secret",
      // Enables the free-search rate limiter for e2e (fail-open when unset)
      // so search.spec.ts can exercise the rate-limited UI state. FREE_SEARCH_LIMIT
      // is left at its default (5); the dedicated test uses a unique x-forwarded-for
      // per run so it never shares a bucket with the other /search specs.
      RATE_LIMIT_SECRET: "e2e-test-rate-limit-secret",
    },
  },
});

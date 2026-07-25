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
  },
});

import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";

const sandboxChromiumPath = "/opt/pw-browsers/chromium";

// Real bug found live (2026-08-05, Android/Chrome, "button doesn't react at
// all"): next.config.ts's Permissions-Policy set `microphone=()`, which
// blocks microphone access for every origin including the page's own — every
// other voice-input test (search.spec.ts, voice-input-button.test.tsx) uses
// a *fake* SpeechRecognition constructor, which never touches the browser's
// real permission system, so this was never caught. `launchOptions` here
// must be set at the top level of a spec file (Playwright forces a new
// worker for it and rejects it inside a `describe` block), which is why this
// lives in its own file rather than alongside search.spec.ts's other voice-
// input cases. Uses the browser's genuine SpeechRecognition (no fake
// constructor) with a fake media device granted via launch flags, so it
// actually exercises the Permissions-Policy check real Chrome enforces —
// proving `recognition.start()` no longer gets refused outright.
test.use({
  permissions: ["microphone"],
  launchOptions: {
    executablePath: existsSync(sandboxChromiumPath) ? sandboxChromiumPath : undefined,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
});

test("the mic button successfully starts recognition (does not silently fail) once microphone access is actually granted", async ({
  page,
}) => {
  await page.goto("/");
  const micButton = page.getByRole("button", { name: "Frage per Spracheingabe diktieren" });
  await expect(micButton).toBeVisible();
  await micButton.click();

  // If `.start()` had thrown synchronously (the Permissions-Policy bug's
  // exact failure mode), the button would never leave its idle label — this
  // is precisely the "reagiert gar nicht" symptom reported live.
  await expect(page.getByRole("button", { name: "Hört zu — antippen zum Stoppen" })).toBeVisible();
});

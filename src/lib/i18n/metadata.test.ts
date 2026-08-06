import { describe, expect, it } from "vitest";
import { buildLocaleAlternates } from "./metadata";

describe("buildLocaleAlternates", () => {
  it("builds the canonical path for the given locale", () => {
    expect(buildLocaleAlternates("en", "/topics").canonical).toBe("/en/topics");
    expect(buildLocaleAlternates("de", "/topics").canonical).toBe("/de/topics");
  });

  it("treats '/' as the homepage path, not an empty suffix", () => {
    expect(buildLocaleAlternates("fr", "/").canonical).toBe("/fr");
  });

  it("lists all three locales plus x-default in the hreflang map", () => {
    const { languages } = buildLocaleAlternates("en", "/sources");
    expect(languages).toEqual({
      de: "/de/sources",
      en: "/en/sources",
      fr: "/fr/sources",
      "x-default": "/de/sources",
    });
  });

  it("always points x-default at German, regardless of the requested locale", () => {
    expect(buildLocaleAlternates("fr", "/about").languages["x-default"]).toBe("/de/about");
  });
});

import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("emits one entry per route per locale (8 routes x 3 locales)", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(24);
  });

  it("uses the configured base URL and a locale-prefixed path for every entry", () => {
    const entries = sitemap();
    for (const entry of entries) {
      expect(entry.url).toMatch(/^http:\/\/localhost:3000\/(de|en|fr)(\/.*)?$/);
    }
  });

  it("includes the German homepage with hreflang alternates for all three locales plus x-default", () => {
    const entries = sitemap();
    const homepage = entries.find((entry) => entry.url === "http://localhost:3000/de");
    expect(homepage).toBeDefined();
    expect(homepage?.alternates?.languages).toEqual({
      de: "http://localhost:3000/de",
      en: "http://localhost:3000/en",
      fr: "http://localhost:3000/fr",
      "x-default": "http://localhost:3000/de",
    });
  });

  it("includes every locale variant of /topics", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain("http://localhost:3000/de/topics");
    expect(urls).toContain("http://localhost:3000/en/topics");
    expect(urls).toContain("http://localhost:3000/fr/topics");
  });
});

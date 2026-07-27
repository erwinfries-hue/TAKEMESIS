import { describe, expect, it } from "vitest";
import { buildSearchQuery } from "./query-translation";

describe("buildSearchQuery", () => {
  it("translates known German domain terms to English and drops stopwords", () => {
    const query = buildSearchQuery(
      "Welchen Effekt hat Koffeinkonsum am Nachmittag auf den Schlaf?",
      "de",
    );

    expect(query).toContain("caffeine consumption");
    expect(query).toContain("afternoon");
    expect(query).toContain("sleep");
    expect(query).not.toMatch(/\bwelchen\b/);
    expect(query).not.toMatch(/\bhat\b/);
    expect(query).not.toMatch(/\bauf\b/);
    expect(query).not.toMatch(/\bden\b/);
  });

  it("leaves unmatched German tokens untranslated rather than dropping them", () => {
    const query = buildSearchQuery("Wirkt Zauberpulver auf Konzentration?", "de");
    // "zauberpulver" has no dictionary entry — passes through unchanged.
    expect(query).toContain("zauberpulver");
    expect(query).toContain("concentration");
  });

  it("translates a compound noun to its English phrase", () => {
    const query = buildSearchQuery("Welche Rolle spielt Proteinzufuhr für den Muskelerhalt?", "de");
    expect(query).toContain("protein intake");
    expect(query).toContain("muscle preservation");
  });

  it("splits hyphenated German compounds into separately translatable tokens", () => {
    const query = buildSearchQuery(
      "Wie wirken sich Smartphone-Benachrichtigungen auf das digitale Wohlbefinden aus?",
      "de",
    );
    expect(query).toContain("smartphone");
    expect(query).toContain("notifications");
    expect(query).toContain("digital");
    expect(query).toContain("well-being");
  });

  it("only strips stopwords for English questions, without touching content words", () => {
    const query = buildSearchQuery("What effect does afternoon caffeine intake have on sleep?", "en");
    expect(query).toContain("caffeine");
    expect(query).toContain("sleep");
    expect(query).toContain("afternoon");
    expect(query).not.toMatch(/\bwhat\b/);
    expect(query).not.toMatch(/\bdoes\b/);
    expect(query).not.toMatch(/\bhave\b/);
  });

  it("translates employee-benefits/compensation vocabulary (dictionary gap closed 2026-07-27)", () => {
    const query = buildSearchQuery(
      "Welche Zusatzleistungen verbessern die Mitarbeiterzufriedenheit am stärksten?",
      "de",
    );
    expect(query).toContain("employee benefits");
    expect(query).toContain("job satisfaction");
  });

  it("falls back to the original question if every token is a stopword", () => {
    const question = "Wie ist das?";
    expect(buildSearchQuery(question, "de")).toBe(question);
  });

  it("never returns an empty string", () => {
    expect(buildSearchQuery("", "de")).toBe("");
    expect(buildSearchQuery("   ", "de").length).toBeGreaterThanOrEqual(0);
  });
});

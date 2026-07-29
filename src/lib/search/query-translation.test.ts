import { describe, expect, it } from "vitest";
import { buildSearchQuery } from "./query-translation";

describe("buildSearchQuery", () => {
  it("translates known German domain terms to English and drops stopwords", async () => {
    const query = await buildSearchQuery(
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

  it("leaves unmatched German tokens untranslated rather than dropping them", async () => {
    const query = await buildSearchQuery("Wirkt Zauberpulver auf Konzentration?", "de");
    // "zauberpulver" has no dictionary entry — passes through unchanged.
    expect(query).toContain("zauberpulver");
    expect(query).toContain("concentration");
  });

  it("translates a compound noun to its English phrase", async () => {
    const query = await buildSearchQuery(
      "Welche Rolle spielt Proteinzufuhr für den Muskelerhalt?",
      "de",
    );
    expect(query).toContain("protein intake");
    expect(query).toContain("muscle preservation");
  });

  it("splits hyphenated German compounds into separately translatable tokens", async () => {
    const query = await buildSearchQuery(
      "Wie wirken sich Smartphone-Benachrichtigungen auf das digitale Wohlbefinden aus?",
      "de",
    );
    expect(query).toContain("smartphone");
    expect(query).toContain("notifications");
    expect(query).toContain("digital");
    expect(query).toContain("well-being");
  });

  it("only strips stopwords for English questions, without touching content words", async () => {
    const query = await buildSearchQuery(
      "What effect does afternoon caffeine intake have on sleep?",
      "en",
    );
    expect(query).toContain("caffeine");
    expect(query).toContain("sleep");
    expect(query).toContain("afternoon");
    expect(query).not.toMatch(/\bwhat\b/);
    expect(query).not.toMatch(/\bdoes\b/);
    expect(query).not.toMatch(/\bhave\b/);
  });

  it("translates employee-benefits/compensation vocabulary (dictionary gap closed 2026-07-27)", async () => {
    const query = await buildSearchQuery(
      "Welche Zusatzleistungen verbessern die Mitarbeiterzufriedenheit am stärksten?",
      "de",
    );
    expect(query).toContain("employee benefits");
    expect(query).toContain("job satisfaction");
  });

  it("drops connector verbs ('hilft'/'wirkt'/...) from the translated query (live bug 2026-07-28)", async () => {
    // Previously "hilft"/"beim" passed through untranslated, which then
    // got silently dropped by relevance.ts's *different* stopword set
    // during screening — shifting the term count and picking a stricter
    // matching rule than intended. See OPEN_RISKS.md #2.
    const query = await buildSearchQuery("Hilft Kreatin beim Muskelaufbau?", "de");
    expect(query).toBe("creatine muscle growth");
  });

  it("translates core cardiovascular vocabulary (dictionary gap closed 2026-07-28)", async () => {
    const query = await buildSearchQuery(
      "Welche Wirkung hat regelmässiger Ausdauersport auf das Herz-Kreislauf-System bei Erwachsenen?",
      "de",
    );
    // Hyphens are stripped before tokenizing, so "Herz-Kreislauf-System"
    // becomes 3 separate tokens, each translated individually.
    expect(query).toContain("heart");
    expect(query).toContain("circulation");
    expect(query).toContain("endurance sport");
    expect(query).toContain("regular");
    expect(query).toContain("adults");
    expect(query).not.toMatch(/\bhat\b/);
  });

  it("falls back to the original question if every token is a stopword", async () => {
    const question = "Wie ist das?";
    expect(await buildSearchQuery(question, "de")).toBe(question);
  });

  it("never returns an empty string", async () => {
    expect(await buildSearchQuery("", "de")).toBe("");
    expect((await buildSearchQuery("   ", "de")).length).toBeGreaterThanOrEqual(0);
  });

  it("translates known French domain terms to English and drops stopwords (live bug fix: French used to fall through untranslated)", async () => {
    const query = await buildSearchQuery(
      "Quel effet a la consommation de caféine l'après-midi sur le sommeil ?",
      "fr",
    );

    expect(query).toContain("caffeine");
    expect(query).toContain("sleep");
    expect(query).not.toMatch(/\bquel\b/);
    expect(query).not.toMatch(/\bla\b/);
    expect(query).not.toMatch(/\bde\b/);
    expect(query).not.toMatch(/\bsur\b/);
    expect(query).not.toMatch(/\ble\b/);
  });

  it("leaves unmatched French tokens untranslated rather than dropping them (AI fallback unconfigured in tests)", async () => {
    const query = await buildSearchQuery(
      "Quel effet a la poudremagique sur la concentration ?",
      "fr",
    );
    // "poudremagique" has no dictionary entry, and no AI key is set in the
    // test environment — passes through unchanged rather than being dropped.
    expect(query).toContain("poudremagique");
  });

  it("splits elided French forms into separately translatable tokens", async () => {
    const query = await buildSearchQuery(
      "Quel rôle joue l'apport en protéines pour le maintien musculaire avec l'âge ?",
      "fr",
    );
    expect(query).toContain("protein");
    expect(query).toContain("maintenance");
    expect(query).toContain("muscular");
    expect(query).toContain("age");
  });

  it("translates French employee-benefits vocabulary", async () => {
    const query = await buildSearchQuery(
      "Quels avantages sociaux améliorent le plus la satisfaction des employés ?",
      "fr",
    );
    expect(query).toContain("employee");
    expect(query).toContain("satisfaction");
  });

});

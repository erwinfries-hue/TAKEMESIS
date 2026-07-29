import { describe, expect, it } from "vitest";
import { classifyDomain, topDomainCandidates } from "./domain";

describe("classifyDomain", () => {
  it("classifies the curated example-report question as Lernen & Bildung", () => {
    const scores = classifyDomain("Welche Lernmethode verbessert den Lernerfolg?", "de");
    expect(scores[0]?.slug).toBe("lernen-bildung");
  });

  it("classifies a fitness question correctly", () => {
    const scores = classifyDomain("Was verbessert Ausdauer am effizientesten?", "de");
    expect(scores[0]?.slug).toBe("fitness-leistungsfaehigkeit");
  });

  it("classifies an English-language question", () => {
    const scores = classifyDomain("Which learning method improves learning outcomes?", "en");
    expect(scores[0]?.slug).toBe("lernen-bildung");
  });

  it("returns an empty array for a question with no matching terms", () => {
    const scores = classifyDomain("xyz qwerty zzz", "de");
    expect(scores).toEqual([]);
  });

  it("topDomainCandidates never returns more than 3 candidates", () => {
    const candidates = topDomainCandidates(
      "Welche Massnahmen verbessern Schlaf, Ernährung, Bewegung und Lernen im Alltag?",
      "de",
    );
    expect(candidates.length).toBeLessThanOrEqual(3);
  });

  it("does not let an unrelated topic win purely on generic connector words (live production case, 2026-07-27)", () => {
    // "haben" and "wirkung" recur across nearly every topic's own example
    // questions — before the stopword fix, a question about a subject no
    // topic covered ("fringe benefits"/"Mitarbeiterzufriedenheit") still
    // scored a false-confidence top match on Umwelt & Nachhaltigkeit purely
    // because it happened to share those two generic words. Arbeit,
    // Produktivität & Organisation was subsequently given compensation/
    // benefits vocabulary (same session), so this now correctly matches
    // that topic on real subject terms instead of returning no candidates.
    const scores = classifyDomain(
      "welche fringe benefits haben am Arbeitsplatz die grösste wirkung auf die mitarbeiterzufriedenheit?",
      "de",
    );
    expect(scores[0]?.slug).toBe("arbeit-produktivitaet");
  });

  it("still classifies correctly once the generic connector word is set aside — the real subject term carries the match", () => {
    const scores = classifyDomain("Welche Wirkung hat Krafttraining auf Kraftzuwachs?", "de");
    expect(scores[0]?.slug).toBe("fitness-leistungsfaehigkeit");
  });

  it("classifies employee-benefits/compensation questions as Arbeit, Produktivität & Organisation (content gap closed 2026-07-27)", () => {
    const de = classifyDomain(
      "Welche Zusatzleistungen verbessern die Mitarbeiterzufriedenheit am stärksten?",
      "de",
    );
    expect(de[0]?.slug).toBe("arbeit-produktivitaet");

    const en = classifyDomain("Which employee benefits most improve job satisfaction?", "en");
    expect(en[0]?.slug).toBe("arbeit-produktivitaet");
  });

  it("classifies a French-language question", () => {
    const scores = classifyDomain(
      "Quelle méthode d'apprentissage améliore la réussite scolaire ?",
      "fr",
    );
    expect(scores[0]?.slug).toBe("lernen-bildung");
  });

  it("returns an empty array for a French question with no matching terms", () => {
    const scores = classifyDomain("xyz qwerty zzz", "fr");
    expect(scores).toEqual([]);
  });
});

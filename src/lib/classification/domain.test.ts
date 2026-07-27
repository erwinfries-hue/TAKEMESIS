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

  it("does not let an off-topic question win purely on generic connector words (live production case, 2026-07-27)", () => {
    // "haben" and "wirkung" recur across nearly every topic's own example
    // questions — before this fix, a question about a subject no topic
    // covers ("fringe benefits"/"Mitarbeiterzufriedenheit") still scored a
    // false-confidence top match on Umwelt & Nachhaltigkeit purely because
    // it happened to share those two generic words.
    const scores = classifyDomain(
      "welche fringe benefits haben am Arbeitsplatz die grösste wirkung auf die mitarbeiterzufriedenheit?",
      "de",
    );
    expect(scores).toEqual([]);
  });

  it("still classifies correctly once the generic connector word is set aside — the real subject term carries the match", () => {
    const scores = classifyDomain("Welche Wirkung hat Krafttraining auf Kraftzuwachs?", "de");
    expect(scores[0]?.slug).toBe("fitness-leistungsfaehigkeit");
  });
});

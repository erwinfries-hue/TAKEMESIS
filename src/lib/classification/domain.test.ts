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
});

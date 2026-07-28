import { describe, expect, it } from "vitest";
import { detectHighRisk, isHighRisk } from "./high-risk";

describe("detectHighRisk", () => {
  it("flags cancer-related questions", () => {
    const matches = detectHighRisk("Welche Chemotherapie hilft bei Krebs am besten?", "de");
    expect(matches.some((m) => m.category === "cancer")).toBe(true);
  });

  it("flags pregnancy-related questions", () => {
    const matches = detectHighRisk("Ist Sport in der Schwangerschaft sicher?", "de");
    expect(matches.some((m) => m.category === "pregnancy")).toBe(true);
  });

  it("flags dosing questions", () => {
    const matches = detectHighRisk("Wie viele Milligramm Ibuprofen sind sicher?", "de");
    expect(matches.some((m) => m.category === "dosing")).toBe(true);
  });

  it("flags English-language high-risk questions", () => {
    expect(isHighRisk("What is the right dosage for this medication?", "en")).toBe(true);
    expect(isHighRisk("Is it safe to exercise during pregnancy?", "en")).toBe(true);
  });

  it("flags pediatric treatment only when a child term and a treatment term co-occur", () => {
    const combined = detectHighRisk("Welche Medikamentendosierung ist für ein Kind sicher?", "de");
    expect(combined.some((m) => m.category === "pediatric_treatment")).toBe(true);

    const developmentOnly = detectHighRisk(
      "Welche Lernumgebung unterstützt Kinder am besten?",
      "de",
    );
    expect(developmentOnly.some((m) => m.category === "pediatric_treatment")).toBe(false);
  });

  it("does not flag ordinary low-risk questions", () => {
    expect(isHighRisk("Welche Lernmethode verbessert den Lernerfolg?", "de")).toBe(false);
    expect(isHighRisk("How does remote work affect productivity?", "en")).toBe(false);
  });

  it("flags mental-health crisis language", () => {
    expect(isHighRisk("Welche Hilfe gibt es bei akuten Suizidgedanken?", "de")).toBe(true);
  });

  it("flags legal/financial high-stakes questions", () => {
    expect(isHighRisk("Wie läuft eine Scheidung rechtlich ab?", "de")).toBe(true);
    expect(isHighRisk("Was sind die Vor- und Nachteile einer Ehescheidung?", "de")).toBe(true);
  });

  it("does not flag 'Entscheidung' as divorce (live bug 2026-07-28: substring match)", () => {
    expect(isHighRisk("Welche Kaufentscheidung ist bei Elektroautos sinnvoll?", "de")).toBe(false);
    expect(isHighRisk("Wie triffst du eine gute Entscheidung unter Unsicherheit?", "de")).toBe(false);
  });
});

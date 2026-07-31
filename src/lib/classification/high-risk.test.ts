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

  it("flags a declined adjective+noun phrase, not just its dictionary form (live bug 2026-07-31: 'psychische krise' missed 'psychischen Krise')", () => {
    expect(isHighRisk("Was tun bei einer psychischen Krise?", "de")).toBe(true);
    expect(isHighRisk("Wie hilft man bei akuten Schmerzen am besten?", "de")).toBe(true);
    expect(isHighRisk("Was tun bei einer fristlosen Kündigung?", "de")).toBe(true);
  });

  it("flags legal/financial high-stakes questions", () => {
    expect(isHighRisk("Wie läuft eine Scheidung rechtlich ab?", "de")).toBe(true);
    expect(isHighRisk("Was sind die Vor- und Nachteile einer Ehescheidung?", "de")).toBe(true);
  });

  it("does not flag 'Entscheidung' as divorce (live bug 2026-07-28: substring match)", () => {
    expect(isHighRisk("Welche Kaufentscheidung ist bei Elektroautos sinnvoll?", "de")).toBe(false);
    expect(isHighRisk("Wie triffst du eine gute Entscheidung unter Unsicherheit?", "de")).toBe(false);
  });

  it("flags French-language high-risk questions", () => {
    expect(isHighRisk("Quelle chimiothérapie aide le mieux contre le cancer ?", "fr")).toBe(true);
    expect(isHighRisk("Le sport est-il sûr pendant la grossesse ?", "fr")).toBe(true);
    expect(isHighRisk("Combien de milligrammes d'ibuprofène sont sûrs ?", "fr")).toBe(true);
    expect(isHighRisk("Comment se déroule un divorce sur le plan juridique ?", "fr")).toBe(true);
    expect(isHighRisk("Quelle aide existe en cas d'idées suicidaires aiguës ?", "fr")).toBe(true);
  });

  it("flags French pediatric treatment only when a child term and a treatment term co-occur", () => {
    const combined = detectHighRisk("Quel dosage de médicament convient à un enfant ?", "fr");
    expect(combined.some((m) => m.category === "pediatric_treatment")).toBe(true);

    const developmentOnly = detectHighRisk(
      "Quel environnement d'apprentissage soutient le mieux les enfants ?",
      "fr",
    );
    expect(developmentOnly.some((m) => m.category === "pediatric_treatment")).toBe(false);
  });

  it("does not flag ordinary low-risk French questions", () => {
    expect(isHighRisk("Quelle méthode d'apprentissage améliore la réussite scolaire ?", "fr")).toBe(
      false,
    );
  });
});

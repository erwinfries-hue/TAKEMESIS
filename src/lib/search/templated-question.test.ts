import { describe, expect, it } from "vitest";
import { assembleTemplatedQuestion } from "./templated-question";

describe("assembleTemplatedQuestion", () => {
  it("assembles the German template", () => {
    expect(assembleTemplatedQuestion("regelmässige Bewegung", "das Erkrankungsrisiko", "de")).toBe(
      "Welchen Effekt hat regelmässige Bewegung auf das Erkrankungsrisiko?",
    );
  });

  it("assembles the English template", () => {
    expect(assembleTemplatedQuestion("regular exercise", "disease risk", "en")).toBe(
      "What effect does regular exercise have on disease risk?",
    );
  });

  it("assembles the French template", () => {
    expect(assembleTemplatedQuestion("activité physique régulière", "le risque de maladie", "fr")).toBe(
      "Quel effet activité physique régulière a-t-il sur le risque de maladie ?",
    );
  });

  it("trims whitespace from both fields", () => {
    expect(assembleTemplatedQuestion("  Bewegung  ", "  Risiko  ", "de")).toBe(
      "Welchen Effekt hat Bewegung auf Risiko?",
    );
  });

  it("returns null when the measure field is empty", () => {
    expect(assembleTemplatedQuestion("", "Risiko", "de")).toBeNull();
  });

  it("returns null when the outcome field is empty", () => {
    expect(assembleTemplatedQuestion("Bewegung", "", "de")).toBeNull();
  });

  it("returns null when both fields are only whitespace", () => {
    expect(assembleTemplatedQuestion("   ", "   ", "de")).toBeNull();
  });
});

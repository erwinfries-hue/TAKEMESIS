import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { AI_EXTRACTION_ENABLED: true, ANTHROPIC_API_KEY: "test-key" },
}));

import { checkResearchability, isConfidentlyResearchable } from "./researchability";

describe("isConfidentlyResearchable", () => {
  it("recognizes an effect/relationship question as confidently researchable (German)", () => {
    expect(isConfidentlyResearchable("Welche Wirkung hat Krafttraining auf Kraftzuwachs?", "de")).toBe(
      true,
    );
    expect(isConfidentlyResearchable("Hilft Kreatin beim Muskelaufbau?", "de")).toBe(true);
  });

  it("recognizes an effect/relationship question as confidently researchable (English)", () => {
    expect(isConfidentlyResearchable("Does creatine improve physical performance?", "en")).toBe(true);
  });

  it("does not treat the real production trivia case as confidently researchable", () => {
    expect(isConfidentlyResearchable("Warum ist der Eiffelturm so hoch?", "de")).toBe(false);
  });

  it("does not treat a plain factual question as confidently researchable", () => {
    expect(isConfidentlyResearchable("Wie viele Einwohner hat Paris?", "de")).toBe(false);
  });
});

describe("checkResearchability", () => {
  it("uses the fast path (no AI call) for a confidently researchable question", async () => {
    const classifyResearchability = vi.fn();
    const result = await checkResearchability("Hilft Kreatin beim Muskelaufbau?", "de", {
      classifyResearchability,
    });
    expect(result).toEqual({ researchable: true, source: "fast_path" });
    expect(classifyResearchability).not.toHaveBeenCalled();
  });

  it("calls the AI classifier for an ambiguous question and returns its verdict", async () => {
    const classifyResearchability = vi.fn().mockResolvedValue(false);
    const result = await checkResearchability("Warum ist der Eiffelturm so hoch?", "de", {
      classifyResearchability,
    });
    expect(result).toEqual({ researchable: false, source: "ai" });
    expect(classifyResearchability).toHaveBeenCalledTimes(1);
  });

  it("fails open when the AI classifier returns null", async () => {
    const classifyResearchability = vi.fn().mockResolvedValue(null);
    const result = await checkResearchability("Warum ist der Eiffelturm so hoch?", "de", {
      classifyResearchability,
    });
    expect(result).toEqual({ researchable: true, source: "ai_unavailable" });
  });

  it("fails open when the AI classifier throws", async () => {
    const classifyResearchability = vi.fn().mockRejectedValue(new Error("network down"));
    const result = await checkResearchability("Warum ist der Eiffelturm so hoch?", "de", {
      classifyResearchability,
    });
    expect(result).toEqual({ researchable: true, source: "ai_unavailable" });
  });
});

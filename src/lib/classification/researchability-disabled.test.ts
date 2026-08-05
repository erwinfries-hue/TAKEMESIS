import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { AI_EXTRACTION_ENABLED: false, ANTHROPIC_API_KEY: undefined },
}));

import { checkResearchability } from "./researchability";

describe("checkResearchability with AI not configured", () => {
  it("fails open (treated as researchable) without ever calling the AI classifier", async () => {
    const classifyResearchability = vi.fn();
    const result = await checkResearchability("Warum ist der Eiffelturm so hoch?", "de", {
      classifyResearchability,
    });
    expect(result).toEqual({ researchable: true, source: "ai_unavailable" });
    expect(classifyResearchability).not.toHaveBeenCalled();
  });
});

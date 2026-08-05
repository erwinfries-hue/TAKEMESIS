import { describe, expect, it, vi } from "vitest";
import { classifyResearchability } from "./researchability-classification";
import type { AiMessagesClient } from "./study-extraction";

function fakeClient(researchable: boolean | "no-tool-use" | "malformed"): AiMessagesClient {
  if (researchable === "no-tool-use") {
    return {
      create: vi.fn().mockResolvedValue({ content: [{ type: "text", text: "no tool use" }] }),
    } as unknown as AiMessagesClient;
  }
  if (researchable === "malformed") {
    return {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "tool_use", id: "t1", name: "classify_researchability", input: {} }],
      }),
    } as unknown as AiMessagesClient;
  }
  return {
    create: vi.fn().mockResolvedValue({
      content: [
        { type: "tool_use", id: "t1", name: "classify_researchability", input: { researchable } },
      ],
    }),
  } as unknown as AiMessagesClient;
}

describe("classifyResearchability", () => {
  it("returns true for a researchable classification", async () => {
    const client = fakeClient(true);
    const result = await classifyResearchability("Welche Rolle spielt Proteinzufuhr?", "de", client);
    expect(result).toBe(true);
    expect(client.create).toHaveBeenCalledTimes(1);
  });

  it("returns false for a not-researchable classification", async () => {
    const client = fakeClient(false);
    const result = await classifyResearchability("Warum ist der Eiffelturm so hoch?", "de", client);
    expect(result).toBe(false);
  });

  it("returns null when the response has no tool_use block", async () => {
    const client = fakeClient("no-tool-use");
    const result = await classifyResearchability("Some question", "en", client);
    expect(result).toBeNull();
  });

  it("returns null instead of a malformed result when the model omits the required field", async () => {
    const client = fakeClient("malformed");
    const result = await classifyResearchability("Some question", "en", client);
    expect(result).toBeNull();
  });
});

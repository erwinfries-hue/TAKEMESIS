import { describe, expect, it, vi } from "vitest";
import { synthesizeReport, type ReportSynthesisResult } from "./report-synthesis";
import type { AiMessagesClient } from "./study-extraction";

function fakeClient(result: ReportSynthesisResult | null): AiMessagesClient {
  return {
    create: vi.fn().mockResolvedValue({
      content: result
        ? [{ type: "tool_use", id: "t1", name: "record_report_synthesis", input: result }]
        : [{ type: "text", text: "no tool use" }],
    }),
  } as unknown as AiMessagesClient;
}

const SAMPLE_RESULT: ReportSynthesisResult = {
  keyFindings: ["Creatine modestly increases lean mass in resistance-trained adults."],
  synthesis: "Across the included studies, the direction of effect is consistent but small.",
  practicalInterpretation: "This is general orientation, not individualized advice.",
};

describe("synthesizeReport", () => {
  it("returns null without calling the AI client when there are no studies", async () => {
    const client = fakeClient(SAMPLE_RESULT);
    const result = await synthesizeReport(
      { question: "Does X help with Y?", confidenceLabel: "moderate", studies: [] },
      client,
    );
    expect(result).toBeNull();
    expect(client.create).not.toHaveBeenCalled();
  });

  it("returns the synthesis from the tool-use block", async () => {
    const client = fakeClient(SAMPLE_RESULT);
    const result = await synthesizeReport(
      {
        question: "Does creatine help with muscle mass?",
        confidenceLabel: "moderate",
        studies: [
          {
            citation: "Author (2022). A trial.",
            design: "rct",
            fields: {
              population: "Adults",
              intervention: "Creatine",
              outcome: "Lean mass",
              result: "Increase",
              uncertainty: null,
              limitations: null,
              fundingConflicts: null,
            },
          },
        ],
      },
      client,
    );
    expect(result).toEqual(SAMPLE_RESULT);
    expect(client.create).toHaveBeenCalledTimes(1);
  });

  it("returns null when the response has no tool_use block", async () => {
    const client = fakeClient(null);
    const result = await synthesizeReport(
      {
        question: "Q",
        confidenceLabel: "limited",
        studies: [{ citation: "A (2020).", design: "cohort", fields: null }],
      },
      client,
    );
    expect(result).toBeNull();
  });
});

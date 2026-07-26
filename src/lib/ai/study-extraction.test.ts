import { describe, expect, it, vi } from "vitest";
import { extractStudyFields, type AiMessagesClient, type ExtractedStudyFields } from "./study-extraction";

function fakeClient(fields: ExtractedStudyFields | null): AiMessagesClient {
  return {
    create: vi.fn().mockResolvedValue({
      content: fields
        ? [{ type: "tool_use", id: "t1", name: "record_study_fields", input: fields }]
        : [{ type: "text", text: "no tool use" }],
    }),
  } as unknown as AiMessagesClient;
}

const SAMPLE_FIELDS: ExtractedStudyFields = {
  population: "Adults aged 18-65",
  intervention: "Daily creatine supplementation",
  outcome: "Lean muscle mass",
  result: "Modest increase versus placebo",
  uncertainty: "95% CI reported",
  limitations: "Small sample size",
  fundingConflicts: null,
};

describe("extractStudyFields", () => {
  it("returns null without calling the AI client when there is no title or abstract", async () => {
    const client = fakeClient(SAMPLE_FIELDS);
    const result = await extractStudyFields({ title: null, abstract: null }, client);
    expect(result).toBeNull();
    expect(client.create).not.toHaveBeenCalled();
  });

  it("returns the extracted fields from the tool-use block", async () => {
    const client = fakeClient(SAMPLE_FIELDS);
    const result = await extractStudyFields(
      { title: "Creatine and muscle mass", abstract: "A randomized trial..." },
      client,
    );
    expect(result).toEqual(SAMPLE_FIELDS);
    expect(client.create).toHaveBeenCalledTimes(1);
  });

  it("returns null when the response has no tool_use block", async () => {
    const client = fakeClient(null);
    const result = await extractStudyFields(
      { title: "Some study", abstract: "Some abstract" },
      client,
    );
    expect(result).toBeNull();
  });

  it("returns null instead of a malformed result when the model omits a required field", async () => {
    // Forced tool_choice doesn't guarantee schema conformance — a
    // missing/mistyped field must fail safe (null), not silently produce
    // undefined that gets spread into the report and rendered.
    const client: AiMessagesClient = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "tool_use",
            id: "t1",
            name: "record_study_fields",
            input: { population: "Adults", intervention: 42 },
          },
        ],
      }),
    } as unknown as AiMessagesClient;

    const result = await extractStudyFields(
      { title: "Some study", abstract: "Some abstract" },
      client,
    );
    expect(result).toBeNull();
  });
});

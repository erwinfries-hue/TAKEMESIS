import { describe, expect, it, vi } from "vitest";
import { askReportChat, type ReportChatResult } from "./report-chat";
import type { AiMessagesClient } from "./study-extraction";

function fakeClient(result: ReportChatResult | null): AiMessagesClient {
  return {
    create: vi.fn().mockResolvedValue({
      content: result
        ? [{ type: "tool_use", id: "t1", name: "record_report_chat_answer", input: result }]
        : [{ type: "text", text: "no tool use" }],
    }),
  } as unknown as AiMessagesClient;
}

const SAMPLE_STUDY = {
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
};

describe("askReportChat", () => {
  it("returns null without calling the AI client when there are no studies", async () => {
    const client = fakeClient({ answer: "x", answerableFromReport: true });
    const result = await askReportChat(
      { originalQuestion: "Q", followUpQuestion: "more detail?", studies: [] },
      client,
    );
    expect(result).toBeNull();
    expect(client.create).not.toHaveBeenCalled();
  });

  it("returns null without calling the AI client when the follow-up is empty", async () => {
    const client = fakeClient({ answer: "x", answerableFromReport: true });
    const result = await askReportChat(
      { originalQuestion: "Q", followUpQuestion: "   ", studies: [SAMPLE_STUDY] },
      client,
    );
    expect(result).toBeNull();
    expect(client.create).not.toHaveBeenCalled();
  });

  it("returns the grounded answer from the tool-use block", async () => {
    const sample: ReportChatResult = {
      answer: "The included trial found an increase in lean mass with creatine.",
      answerableFromReport: true,
    };
    const client = fakeClient(sample);
    const result = await askReportChat(
      {
        originalQuestion: "Does creatine help with muscle mass?",
        followUpQuestion: "What population was studied?",
        studies: [SAMPLE_STUDY],
      },
      client,
    );
    expect(result).toEqual(sample);
    expect(client.create).toHaveBeenCalledTimes(1);
  });

  it("can honestly report a question isn't answerable from this report's studies", async () => {
    const sample: ReportChatResult = {
      answer: "The studies found for this report don't cover long-term safety data.",
      answerableFromReport: false,
    };
    const client = fakeClient(sample);
    const result = await askReportChat(
      {
        originalQuestion: "Does creatine help with muscle mass?",
        followUpQuestion: "Is it safe to take for 10 years?",
        studies: [SAMPLE_STUDY],
      },
      client,
    );
    expect(result?.answerableFromReport).toBe(false);
  });

  it("returns null when the response has no tool_use block", async () => {
    const client = fakeClient(null);
    const result = await askReportChat(
      { originalQuestion: "Q", followUpQuestion: "more?", studies: [SAMPLE_STUDY] },
      client,
    );
    expect(result).toBeNull();
  });

  it("returns null instead of a malformed result when the model returns the wrong shape", async () => {
    const client: AiMessagesClient = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "tool_use",
            id: "t1",
            name: "record_report_chat_answer",
            input: { answer: "x" }, // missing answerableFromReport
          },
        ],
      }),
    } as unknown as AiMessagesClient;

    const result = await askReportChat(
      { originalQuestion: "Q", followUpQuestion: "more?", studies: [SAMPLE_STUDY] },
      client,
    );
    expect(result).toBeNull();
  });

  it("truncates an overlong follow-up question rather than sending it in full", async () => {
    const sample: ReportChatResult = { answer: "ok", answerableFromReport: true };
    const client = fakeClient(sample);
    const longQuestion = "a".repeat(2000);
    await askReportChat(
      { originalQuestion: "Q", followUpQuestion: longQuestion, studies: [SAMPLE_STUDY] },
      client,
    );
    const call = (client.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const userMessage = call.messages[0].content as string;
    expect(userMessage.length).toBeLessThan(longQuestion.length);
  });
});

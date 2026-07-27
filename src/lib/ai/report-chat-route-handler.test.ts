import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    ANTHROPIC_API_KEY: "test-key",
    AI_EXTRACTION_ENABLED: true,
    AI_MODEL: "test-model",
    AI_MAX_INPUT_CHARS: 24000,
  },
}));

import { handleReportChatRequest } from "./report-chat-route-handler";
import type { ReportChatResult } from "./report-chat";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/report-chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const VALID_BODY = {
  originalQuestion: "Does creatine help with muscle mass?",
  followUpQuestion: "What population was studied?",
  studies: [{ citation: "Author (2022). A trial.", design: "rct", fields: null }],
};

describe("handleReportChatRequest", () => {
  it("returns 400 for a malformed JSON body", async () => {
    const request = new Request("http://localhost/api/report-chat", {
      method: "POST",
      body: "not json",
    });
    const response = await handleReportChatRequest(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when the body fails schema validation", async () => {
    const response = await handleReportChatRequest(jsonRequest({ originalQuestion: "Q" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when the follow-up question exceeds the length cap", async () => {
    const response = await handleReportChatRequest(
      jsonRequest({ ...VALID_BODY, followUpQuestion: "a".repeat(1000) }),
    );
    expect(response.status).toBe(400);
  });

  it("returns the answer on success", async () => {
    const sample: ReportChatResult = { answer: "Adults.", answerableFromReport: true };
    const askReportChatFn = vi.fn().mockResolvedValue(sample);
    const response = await handleReportChatRequest(jsonRequest(VALID_BODY), askReportChatFn);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(sample);
  });

  it("returns 502 when the AI call returns null", async () => {
    const askReportChatFn = vi.fn().mockResolvedValue(null);
    const response = await handleReportChatRequest(jsonRequest(VALID_BODY), askReportChatFn);
    expect(response.status).toBe(502);
  });

  it("returns 502 when the AI call throws", async () => {
    const askReportChatFn = vi.fn().mockRejectedValue(new Error("network error"));
    const response = await handleReportChatRequest(jsonRequest(VALID_BODY), askReportChatFn);
    expect(response.status).toBe(502);
  });
});

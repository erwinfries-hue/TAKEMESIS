import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { ANTHROPIC_API_KEY: undefined, AI_EXTRACTION_ENABLED: false },
}));

import { handleReportChatRequest } from "./report-chat-route-handler";

describe("handleReportChatRequest (AI not configured)", () => {
  it("returns 503 without touching the request body", async () => {
    const request = new Request("http://localhost/api/report-chat", { method: "POST" });
    const response = await handleReportChatRequest(request);
    expect(response.status).toBe(503);
  });
});

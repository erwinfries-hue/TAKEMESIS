import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { EMAIL_FROM: "TEKMESIS <no-reply@tekmesis.com>" },
}));

import { sendEmail } from "./send";
import { buildReportReadyEmail } from "./templates";

describe("sendEmail", () => {
  it("sends via the injected client with the configured from-address", async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: "email_1" } });
    const client = { emails: { send } };
    const content = buildReportReadyEmail({
      locale: "de",
      reportUrl: "https://tekmesis.com/report/abc",
      supportEmail: "support@tekmesis.com",
    });

    await sendEmail({ to: "user@example.com", content }, client);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "TEKMESIS <no-reply@tekmesis.com>",
        to: "user@example.com",
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
    );
  });
});

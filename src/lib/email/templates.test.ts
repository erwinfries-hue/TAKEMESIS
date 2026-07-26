import { describe, expect, it } from "vitest";
import {
  buildReportFailedEmail,
  buildReportReadyEmail,
  buildRefundConfirmationEmail,
} from "./templates";

const baseParams = {
  reportUrl: "https://tekmesis.com/report/abc123",
  supportEmail: "support@tekmesis.com",
};

describe("email templates", () => {
  it("never includes any hint of the original question or report content", () => {
    // Simulates a sensitive topic — the templates take no question param at
    // all, so there is no way for one to leak in; this test guards the
    // contract even if a future refactor accidentally threads it through.
    const email = buildReportReadyEmail({ locale: "de", ...baseParams });
    expect(email.subject.toLowerCase()).not.toContain("frage");
    expect(email.html.toLowerCase()).not.toContain("frage:");
  });

  it("report-ready email includes the secure link and support contact", () => {
    const email = buildReportReadyEmail({ locale: "de", ...baseParams });
    expect(email.html).toContain(baseParams.reportUrl);
    expect(email.text).toContain(baseParams.reportUrl);
    expect(email.html).toContain(baseParams.supportEmail);
  });

  it("every template renders the branded navy header bar with the TEKMESIS wordmark", () => {
    for (const build of [buildReportReadyEmail, buildReportFailedEmail, buildRefundConfirmationEmail]) {
      const email = build({ locale: "de", ...baseParams });
      expect(email.html).toContain("#0b2540");
      expect(email.html).toContain(">TEKMESIS<");
    }
  });

  it("report-ready email is localized", () => {
    const de = buildReportReadyEmail({ locale: "de", ...baseParams });
    const en = buildReportReadyEmail({ locale: "en", ...baseParams });
    expect(de.subject).not.toBe(en.subject);
    expect(de.text).not.toBe(en.text);
  });

  it("every template includes the AXIA4 disclaimer footer", () => {
    for (const build of [buildReportReadyEmail, buildReportFailedEmail, buildRefundConfirmationEmail]) {
      const de = build({ locale: "de", ...baseParams });
      expect(de.text).toContain("AXIA4 Digital");
      expect(de.text).toMatch(/ersetzt keine individuelle Fachberatung/);
    }
  });

  it("report-failed email reassures the payment remains valid", () => {
    const email = buildReportFailedEmail({ locale: "de", ...baseParams });
    expect(email.text).toMatch(/Zahlung bleibt gültig/);
  });

  it("refund-confirmation email confirms the refund", () => {
    const deEmail = buildRefundConfirmationEmail({ locale: "de", ...baseParams });
    expect(deEmail.subject).toBe("Rückerstattung bestätigt");
    const enEmail = buildRefundConfirmationEmail({ locale: "en", ...baseParams });
    expect(enEmail.subject).toBe("Refund confirmed");
  });
});

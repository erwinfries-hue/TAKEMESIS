import { describe, expect, it } from "vitest";
import {
  buildReportFailedEmail,
  buildReportReadyEmail,
  buildRefundConfirmationEmail,
  buildTopicDigestConfirmationEmail,
  buildTopicDigestEmail,
  buildUpdateCheckResultEmail,
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
      expect(de.text).toContain("AXIA4");
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

  describe("buildUpdateCheckResultEmail (decision #7)", () => {
    const oneNewStudy = [
      { title: "New Fixture Study", venue: "Fixture Journal", year: 2026, sourceUrl: "https://example.com/s1", doi: null },
    ];

    it("lists each new study with a link, when studies were found", () => {
      const email = buildUpdateCheckResultEmail({ locale: "de", ...baseParams, newStudies: oneNewStudy });
      expect(email.html).toContain("New Fixture Study");
      expect(email.html).toContain("https://example.com/s1");
      expect(email.subject).toBe("Neue Studien zu deiner TEKMESIS-Frage gefunden");
    });

    it("falls back to a doi.org link when sourceUrl is missing", () => {
      const email = buildUpdateCheckResultEmail({
        locale: "en",
        ...baseParams,
        newStudies: [{ title: "DOI-only Study", venue: null, year: null, sourceUrl: null, doi: "10.1/xyz" }],
      });
      expect(email.html).toContain("https://doi.org/10.1/xyz");
    });

    it("uses a distinct subject and body when no new studies were found, without a study list", () => {
      const email = buildUpdateCheckResultEmail({ locale: "de", ...baseParams, newStudies: [] });
      expect(email.subject).toBe("Update-Check: keine neuen Studien gefunden");
      expect(email.html).not.toContain("<ul");
      expect(email.text).toMatch(/keine neuen Studien/);
    });

    it("explicitly states the list is unscreened/unsynthesized, not a full new analysis", () => {
      const email = buildUpdateCheckResultEmail({ locale: "de", ...baseParams, newStudies: oneNewStudy });
      expect(email.text).toMatch(/noch nicht.*ausgewertet|nicht.*zusammengefasst/);
    });

    it("is localized across all three locales", () => {
      const de = buildUpdateCheckResultEmail({ locale: "de", ...baseParams, newStudies: oneNewStudy });
      const en = buildUpdateCheckResultEmail({ locale: "en", ...baseParams, newStudies: oneNewStudy });
      const fr = buildUpdateCheckResultEmail({ locale: "fr", ...baseParams, newStudies: oneNewStudy });
      expect(de.subject).not.toBe(en.subject);
      expect(en.subject).not.toBe(fr.subject);
    });

    it("never includes any hint of the original question", () => {
      const email = buildUpdateCheckResultEmail({ locale: "de", ...baseParams, newStudies: oneNewStudy });
      expect(email.html.toLowerCase()).not.toContain("frage:");
    });

    it("shows 'not reported' rather than fabricating a missing title", () => {
      const email = buildUpdateCheckResultEmail({
        locale: "de",
        ...baseParams,
        newStudies: [{ title: null, venue: null, year: null, sourceUrl: null, doi: null }],
      });
      expect(email.html).toContain("nicht angegeben");
    });
  });

  describe("buildTopicDigestConfirmationEmail (Themen-Digest)", () => {
    const digestBaseParams = {
      browseUrl: "https://tekmesis.com/topics",
      unsubscribeUrl: "https://tekmesis.com/api/topics/unsubscribe?id=sub-1&sig=abc",
      supportEmail: "support@tekmesis.com",
    };

    it("lists every subscribed topic and includes the unsubscribe link", () => {
      const email = buildTopicDigestConfirmationEmail({
        locale: "de",
        ...digestBaseParams,
        topicNames: ["Schlaf & Regeneration", "Ernährung & Supplements"],
      });
      expect(email.html).toContain("Schlaf & Regeneration");
      expect(email.html).toContain("Ernährung & Supplements");
      expect(email.html).toContain(digestBaseParams.unsubscribeUrl);
      expect(email.text).toContain(digestBaseParams.unsubscribeUrl);
    });

    it("is localized across all three locales", () => {
      const params = { ...digestBaseParams, topicNames: ["Schlaf & Regeneration"] };
      const de = buildTopicDigestConfirmationEmail({ locale: "de", ...params });
      const en = buildTopicDigestConfirmationEmail({ locale: "en", ...params });
      const fr = buildTopicDigestConfirmationEmail({ locale: "fr", ...params });
      expect(de.subject).not.toBe(en.subject);
      expect(en.subject).not.toBe(fr.subject);
    });
  });

  describe("buildTopicDigestEmail (weekly Themen-Digest)", () => {
    const digestBaseParams = {
      browseUrl: "https://tekmesis.com/topics",
      unsubscribeUrl: "https://tekmesis.com/api/topics/unsubscribe?id=sub-1&sig=abc",
      supportEmail: "support@tekmesis.com",
    };
    const sections = [
      {
        topicName: "Schlaf & Regeneration",
        studies: [
          { title: "New Sleep Study", venue: "Sleep Journal", year: 2026, sourceUrl: "https://example.com/s1", doi: null },
        ],
      },
    ];

    it("renders one heading per topic section with its studies", () => {
      const email = buildTopicDigestEmail({ locale: "de", ...digestBaseParams, sections });
      expect(email.html).toContain("Schlaf & Regeneration");
      expect(email.html).toContain("New Sleep Study");
      expect(email.html).toContain("https://example.com/s1");
    });

    it("includes the unsubscribe link", () => {
      const email = buildTopicDigestEmail({ locale: "en", ...digestBaseParams, sections });
      expect(email.html).toContain(digestBaseParams.unsubscribeUrl);
      expect(email.text).toContain(digestBaseParams.unsubscribeUrl);
    });

    it("never claims the studies were analyzed for this topic — points to generating a report instead", () => {
      const email = buildTopicDigestEmail({ locale: "de", ...digestBaseParams, sections });
      expect(email.html).toMatch(/nicht.*inhaltlich ausgewertet|nicht speziell/);
    });

    it("is localized across all three locales", () => {
      const de = buildTopicDigestEmail({ locale: "de", ...digestBaseParams, sections });
      const en = buildTopicDigestEmail({ locale: "en", ...digestBaseParams, sections });
      const fr = buildTopicDigestEmail({ locale: "fr", ...digestBaseParams, sections });
      expect(de.subject).not.toBe(en.subject);
      expect(en.subject).not.toBe(fr.subject);
    });
  });
});

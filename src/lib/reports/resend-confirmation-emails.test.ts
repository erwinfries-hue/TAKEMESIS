import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { SUPPORT_EMAIL: "support@tekmesis.com" },
}));
vi.mock("@/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_APP_BASE_URL: "https://tekmesis.com" },
}));

import { resendMissingConfirmationEmails } from "./resend-confirmation-emails";
import { InMemoryReportRepository } from "./in-memory-report-repository";
import { transitionReportStatus } from "./report-service";
import { FAKE_SEARCH_STATS_FIXTURE, FAKE_TEASER_FIXTURE } from "./report-test-fixtures";

async function createReadyReport(
  repository: InMemoryReportRepository,
  overrides: { email?: string | null; stripeCheckoutSessionId?: string | null; confirmationEmailSentAt?: string | null } = {},
) {
  const report = await repository.create({
    tokenHash: `hash-${Math.random()}`,
    originalQuestion: "q",
    locale: "de",
    domainSlug: "lernen-bildung",
    sourceRoute: null,
    eligibility: "eligible",
    priceVersion: "MVP-01",
    searchStats: FAKE_SEARCH_STATS_FIXTURE,
    previewPayload: FAKE_TEASER_FIXTURE,
  });
  await transitionReportStatus(repository, report.id, "preview_ready");
  await transitionReportStatus(repository, report.id, "checkout_started");
  await transitionReportStatus(repository, report.id, "paid", {
    email: overrides.email === undefined ? "buyer@example.com" : overrides.email,
    stripeCheckoutSessionId:
      overrides.stripeCheckoutSessionId === undefined ? "cs_test_123" : overrides.stripeCheckoutSessionId,
  });
  await transitionReportStatus(repository, report.id, "processing");
  const ready = await transitionReportStatus(repository, report.id, "ready");
  if (overrides.confirmationEmailSentAt) {
    return repository.update(ready.id, { confirmationEmailSentAt: overrides.confirmationEmailSentAt });
  }
  return ready;
}

function fakeStripeClient(reportToken: string | null) {
  return {
    checkout: {
      sessions: {
        retrieve: vi.fn().mockResolvedValue({ metadata: reportToken ? { reportToken } : {} }),
      },
    },
  };
}

describe("resendMissingConfirmationEmails", () => {
  it("resends and records confirmationEmailSentAt for a ready report that never got its email", async () => {
    const repository = new InMemoryReportRepository();
    const report = await createReadyReport(repository);
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const stripeClient = fakeStripeClient("raw-token-123");

    const result = await resendMissingConfirmationEmails(repository, { sendEmail, stripeClient });

    expect(result.sent).toEqual([report.id]);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "buyer@example.com" }),
    );
    expect(stripeClient.checkout.sessions.retrieve).toHaveBeenCalledWith("cs_test_123");
    const updated = await repository.findById(report.id);
    expect(updated?.confirmationEmailSentAt).not.toBeNull();
  });

  it("does not re-send to a report that already has a confirmed send", async () => {
    const repository = new InMemoryReportRepository();
    await createReadyReport(repository, { confirmationEmailSentAt: "2026-08-01T00:00:00.000Z" });
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const result = await resendMissingConfirmationEmails(repository, {
      sendEmail,
      stripeClient: fakeStripeClient("raw-token-123"),
    });

    expect(result.sent).toEqual([]);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("ignores reports that are not ready, even with no confirmed send", async () => {
    const repository = new InMemoryReportRepository();
    const draft = await repository.create({
      tokenHash: "hash-draft",
      originalQuestion: "q",
      locale: "de",
      domainSlug: "lernen-bildung",
      sourceRoute: null,
      eligibility: "eligible",
      priceVersion: "MVP-01",
      searchStats: FAKE_SEARCH_STATS_FIXTURE,
      previewPayload: FAKE_TEASER_FIXTURE,
    });
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const result = await resendMissingConfirmationEmails(repository, {
      sendEmail,
      stripeClient: fakeStripeClient("raw-token-123"),
    });

    expect(result.sent).toEqual([]);
    expect(result.checked).toBe(1);
    expect(sendEmail).not.toHaveBeenCalled();
    void draft;
  });

  it("skips (without throwing) a ready report with no email on file", async () => {
    const repository = new InMemoryReportRepository();
    await createReadyReport(repository, { email: null });
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const result = await resendMissingConfirmationEmails(repository, {
      sendEmail,
      stripeClient: fakeStripeClient("raw-token-123"),
    });

    expect(result.sent).toEqual([]);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("skips and records a reason when the report has no Stripe checkout session id", async () => {
    const repository = new InMemoryReportRepository();
    const report = await createReadyReport(repository, { stripeCheckoutSessionId: null });
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const result = await resendMissingConfirmationEmails(repository, {
      sendEmail,
      stripeClient: fakeStripeClient("raw-token-123"),
    });

    expect(result.sent).toEqual([]);
    expect(result.skipped).toEqual([{ reportId: report.id, reason: "no_checkout_session_id" }]);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("skips and records a reason when the Stripe session has no reportToken metadata", async () => {
    const repository = new InMemoryReportRepository();
    const report = await createReadyReport(repository);
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const result = await resendMissingConfirmationEmails(repository, {
      sendEmail,
      stripeClient: fakeStripeClient(null),
    });

    expect(result.sent).toEqual([]);
    expect(result.skipped).toEqual([
      { reportId: report.id, reason: "no_report_token_in_session_metadata" },
    ]);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("does not persist confirmationEmailSentAt when the email send itself fails, and keeps processing other reports", async () => {
    const repository = new InMemoryReportRepository();
    const failing = await createReadyReport(repository);
    const succeeding = await createReadyReport(repository);
    const sendEmail = vi
      .fn()
      .mockRejectedValueOnce(new Error("resend API down"))
      .mockResolvedValueOnce(undefined);

    const result = await resendMissingConfirmationEmails(repository, {
      sendEmail,
      stripeClient: fakeStripeClient("raw-token-123"),
    });

    expect(result.sent).toEqual([succeeding.id]);
    expect(result.skipped).toEqual([{ reportId: failing.id, reason: "send_failed" }]);
    const updatedFailing = await repository.findById(failing.id);
    expect(updatedFailing?.confirmationEmailSentAt).toBeNull();
  });

  it("builds the report link from the token found on the Stripe session, via the injected reportUrlFor", async () => {
    const repository = new InMemoryReportRepository();
    await createReadyReport(repository);
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const reportUrlFor = vi.fn().mockReturnValue("https://tekmesis.com/report/raw-token-123");

    await resendMissingConfirmationEmails(repository, {
      sendEmail,
      stripeClient: fakeStripeClient("raw-token-123"),
      reportUrlFor,
    });

    expect(reportUrlFor).toHaveBeenCalledWith("raw-token-123");
  });
});

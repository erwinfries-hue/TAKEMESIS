import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { CRON_SECRET: "test-cron-secret", SUPPORT_EMAIL: "support@tekmesis.com" },
}));
vi.mock("@/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_APP_BASE_URL: "https://tekmesis.com" },
}));
vi.mock("@/lib/stripe/client", () => ({
  getStripeClient: () => ({
    checkout: { sessions: { retrieve: vi.fn().mockResolvedValue({ metadata: {} }) } },
  }),
}));

import { handleResendConfirmationEmailsRequest } from "./resend-confirmation-emails-route-handler";
import { InMemoryReportRepository } from "./in-memory-report-repository";
import { transitionReportStatus } from "./report-service";
import { FAKE_SEARCH_STATS_FIXTURE, FAKE_TEASER_FIXTURE } from "./report-test-fixtures";

function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/cron/resend-confirmation-emails", { headers });
}

describe("handleResendConfirmationEmailsRequest", () => {
  it("returns 401 when the Authorization header is missing", async () => {
    const response = await handleResendConfirmationEmailsRequest(
      request(),
      new InMemoryReportRepository(),
    );
    expect(response.status).toBe(401);
  });

  it("returns 401 when the bearer token does not match CRON_SECRET", async () => {
    const response = await handleResendConfirmationEmailsRequest(
      request({ authorization: "Bearer wrong-secret" }),
      new InMemoryReportRepository(),
    );
    expect(response.status).toBe(401);
  });

  it("runs the sweep and returns a summary when authorized", async () => {
    const repository = new InMemoryReportRepository();
    const report = await repository.create({
      tokenHash: "hash",
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
    // No stripeCheckoutSessionId set — exercises the "skipped" path without
    // needing a real/faked Stripe session lookup to succeed.
    await transitionReportStatus(repository, report.id, "paid", { email: "buyer@example.com" });
    await transitionReportStatus(repository, report.id, "processing");
    await transitionReportStatus(repository, report.id, "ready");

    const response = await handleResendConfirmationEmailsRequest(
      request({ authorization: "Bearer test-cron-secret" }),
      repository,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      checked: 1,
      sentCount: 0,
      skipped: [{ reportId: report.id, reason: "no_checkout_session_id" }],
    });
  });
});

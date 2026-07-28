import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { CRON_SECRET: "test-cron-secret" },
}));

import { handleExpireReportsRequest } from "./expire-reports-route-handler";
import { InMemoryReportRepository } from "./in-memory-report-repository";
import { transitionReportStatus } from "./report-service";
import { FAKE_SEARCH_STATS_FIXTURE, FAKE_TEASER_FIXTURE } from "./report-test-fixtures";

function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/cron/expire-reports", { headers });
}

describe("handleExpireReportsRequest", () => {
  it("returns 401 when the Authorization header is missing", async () => {
    const response = await handleExpireReportsRequest(request(), new InMemoryReportRepository());
    expect(response.status).toBe(401);
  });

  it("returns 401 when the bearer token does not match CRON_SECRET", async () => {
    const response = await handleExpireReportsRequest(
      request({ authorization: "Bearer wrong-secret" }),
      new InMemoryReportRepository(),
    );
    expect(response.status).toBe(401);
  });

  it("expires due reports and returns a summary when authorized", async () => {
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
    await transitionReportStatus(repository, report.id, "paid", {
      expiresAt: "2020-01-01T00:00:00.000Z",
    });
    await transitionReportStatus(repository, report.id, "processing");
    await transitionReportStatus(repository, report.id, "ready");

    const response = await handleExpireReportsRequest(
      request({ authorization: "Bearer test-cron-secret" }),
      repository,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ checked: 1, expiredCount: 1 });

    const updated = await repository.findById(report.id);
    expect(updated?.status).toBe("expired");
  });
});

import { describe, expect, it } from "vitest";
import { InMemoryReportRepository } from "./in-memory-report-repository";
import { transitionReportStatus } from "./report-service";
import { expireDueReports } from "./expire-reports";
import { FAKE_SEARCH_STATS_FIXTURE, FAKE_TEASER_FIXTURE } from "./report-test-fixtures";

async function createReadyReport(
  repository: InMemoryReportRepository,
  expiresAt: string | null,
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
  await transitionReportStatus(repository, report.id, "paid", { expiresAt });
  await transitionReportStatus(repository, report.id, "processing");
  return transitionReportStatus(repository, report.id, "ready");
}

describe("expireDueReports", () => {
  it("expires a ready report whose expiresAt is in the past", async () => {
    const repository = new InMemoryReportRepository();
    const report = await createReadyReport(repository, "2020-01-01T00:00:00.000Z");

    const result = await expireDueReports(repository, new Date("2026-07-26T00:00:00.000Z"));

    expect(result.expired).toEqual([report.id]);
    const updated = await repository.findById(report.id);
    expect(updated?.status).toBe("expired");
  });

  it("leaves a ready report whose expiresAt is in the future untouched", async () => {
    const repository = new InMemoryReportRepository();
    const report = await createReadyReport(repository, "2099-01-01T00:00:00.000Z");

    const result = await expireDueReports(repository, new Date("2026-07-26T00:00:00.000Z"));

    expect(result.expired).toEqual([]);
    const updated = await repository.findById(report.id);
    expect(updated?.status).toBe("ready");
  });

  it("ignores reports that are not ready even if expiresAt is null or past", async () => {
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

    const result = await expireDueReports(repository, new Date("2026-07-26T00:00:00.000Z"));

    expect(result.expired).toEqual([]);
    expect(result.checked).toBe(1);
    const updated = await repository.findById(draft.id);
    expect(updated?.status).toBe("draft");
  });

  it("reports the total number of reports checked", async () => {
    const repository = new InMemoryReportRepository();
    await createReadyReport(repository, "2020-01-01T00:00:00.000Z");
    await createReadyReport(repository, "2099-01-01T00:00:00.000Z");

    const result = await expireDueReports(repository, new Date("2026-07-26T00:00:00.000Z"));

    expect(result.checked).toBe(2);
    expect(result.expired).toHaveLength(1);
  });
});

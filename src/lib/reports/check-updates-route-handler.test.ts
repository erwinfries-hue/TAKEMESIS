import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { SUPPORT_EMAIL: "support@tekmesis.com" },
}));
vi.mock("@/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_APP_BASE_URL: "https://tekmesis.com" },
}));

import { handleCheckUpdatesRequest } from "./check-updates-route-handler";
import { InMemoryReportRepository } from "./in-memory-report-repository";
import { transitionReportStatus } from "./report-service";
import { FAKE_SEARCH_STATS_FIXTURE, FAKE_TEASER_FIXTURE } from "./report-test-fixtures";
import { hashReportToken } from "./token";
import type { UpdateCheckResult } from "./update-check";
import type { PremiumReportData } from "./premium-report";

const TOKEN = "test-token-abc";

const FAKE_FINAL_PAYLOAD: PremiumReportData = {
  originalQuestion: "q",
  interpretedQuestion: null,
  locale: "de",
  reportVersion: "premium-v1",
  reportDate: new Date().toISOString(),
  searchDate: new Date().toISOString(),
  sourcesSearched: ["openalex"],
  sourcesUnavailable: [],
  candidateCount: 1,
  duplicatesRemoved: 0,
  includedCount: 1,
  studyTypeDistribution: [],
  publicationYearRange: { earliest: null, latest: null },
  confidenceLabel: "moderate",
  keyFindings: null,
  comparison: [],
  profiles: [],
  synthesisAvailable: false,
  synthesisText: null,
  practicalInterpretationAvailable: false,
  practicalInterpretationText: null,
  sources: [],
};

async function setUpReadyReport(overrides: { email?: string | null } = {}) {
  const repository = new InMemoryReportRepository();
  const created = await repository.create({
    tokenHash: hashReportToken(TOKEN),
    originalQuestion: "Welchen Effekt hat Kreatin auf Muskelaufbau?",
    locale: "de",
    domainSlug: "fitness-leistungsfaehigkeit",
    sourceRoute: null,
    eligibility: "eligible",
    priceVersion: "MVP-01",
    searchStats: FAKE_SEARCH_STATS_FIXTURE,
    previewPayload: FAKE_TEASER_FIXTURE,
  });
  await transitionReportStatus(repository, created.id, "preview_ready");
  await transitionReportStatus(repository, created.id, "checkout_started");
  await transitionReportStatus(repository, created.id, "paid", {
    email: overrides.email === undefined ? "buyer@example.com" : overrides.email,
  });
  await transitionReportStatus(repository, created.id, "processing");
  const report = await transitionReportStatus(repository, created.id, "ready", {
    finalPayload: FAKE_FINAL_PAYLOAD,
  });
  return { repository, report };
}

const NO_NEW_STUDIES: UpdateCheckResult = { checkedAt: "2026-08-03T12:00:00.000Z", newStudies: [] };
const ONE_NEW_STUDY: UpdateCheckResult = {
  checkedAt: "2026-08-03T12:00:00.000Z",
  newStudies: [{ title: "New", venue: null, year: null, source: "openalex", sourceUrl: null, doi: "10.1/new" }],
};

describe("handleCheckUpdatesRequest", () => {
  it("returns 404 when no report matches the token", async () => {
    const response = await handleCheckUpdatesRequest("no-such-token", {
      reportRepository: new InMemoryReportRepository(),
    });
    expect(response.status).toBe(404);
  });

  it("returns 404 for a revoked report", async () => {
    const { repository, report } = await setUpReadyReport();
    await repository.update(report.id, { revokedAt: new Date().toISOString() });

    const response = await handleCheckUpdatesRequest(TOKEN, { reportRepository: repository });
    expect(response.status).toBe(404);
  });

  it("returns 409 when the report isn't ready yet", async () => {
    const repository = new InMemoryReportRepository();
    await repository.create({
      tokenHash: hashReportToken(TOKEN),
      originalQuestion: "q",
      locale: "de",
      domainSlug: "lernen-bildung",
      sourceRoute: null,
      eligibility: "eligible",
      priceVersion: "MVP-01",
      searchStats: FAKE_SEARCH_STATS_FIXTURE,
      previewPayload: FAKE_TEASER_FIXTURE,
    });

    const response = await handleCheckUpdatesRequest(TOKEN, { reportRepository: repository });
    expect(response.status).toBe(409);
  });

  it("returns 409 when the report has no email on file", async () => {
    const { repository } = await setUpReadyReport({ email: null });
    const response = await handleCheckUpdatesRequest(TOKEN, { reportRepository: repository });
    expect(response.status).toBe(409);
  });

  it("returns 409 when triggered again within the rate-limit interval", async () => {
    const { repository, report } = await setUpReadyReport();
    await repository.update(report.id, { lastUpdateCheckAt: new Date().toISOString() });

    const response = await handleCheckUpdatesRequest(TOKEN, { reportRepository: repository });
    expect(response.status).toBe(409);
  });

  it("runs the check, sends the result email, and records lastUpdateCheckAt on success", async () => {
    const { repository, report } = await setUpReadyReport();
    const sendEmail = vi.fn().mockResolvedValue(undefined);

    const response = await handleCheckUpdatesRequest(TOKEN, {
      reportRepository: repository,
      runUpdateCheckFn: async () => ONE_NEW_STUDY,
      sendEmail,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, newStudyCount: 1 });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "buyer@example.com" }),
    );
    const updated = await repository.findById(report.id);
    expect(updated?.lastUpdateCheckAt).toBe(ONE_NEW_STUDY.checkedAt);
  });

  it("reports zero new studies as a successful, distinct outcome", async () => {
    const { repository } = await setUpReadyReport();
    const response = await handleCheckUpdatesRequest(TOKEN, {
      reportRepository: repository,
      runUpdateCheckFn: async () => NO_NEW_STUDIES,
      sendEmail: vi.fn().mockResolvedValue(undefined),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, newStudyCount: 0 });
  });

  it("does not advance lastUpdateCheckAt when the search itself fails, so it can be retried", async () => {
    const { repository, report } = await setUpReadyReport();
    const response = await handleCheckUpdatesRequest(TOKEN, {
      reportRepository: repository,
      runUpdateCheckFn: async () => {
        throw new Error("adapter down");
      },
    });

    expect(response.status).toBe(502);
    const updated = await repository.findById(report.id);
    expect(updated?.lastUpdateCheckAt).toBeNull();
  });

  it("still records lastUpdateCheckAt when the email send fails, so a stuck provider can't be retried unbounded", async () => {
    const { repository, report } = await setUpReadyReport();
    const response = await handleCheckUpdatesRequest(TOKEN, {
      reportRepository: repository,
      runUpdateCheckFn: async () => NO_NEW_STUDIES,
      sendEmail: vi.fn().mockRejectedValue(new Error("resend down")),
    });

    expect(response.status).toBe(502);
    const updated = await repository.findById(report.id);
    expect(updated?.lastUpdateCheckAt).toBe(NO_NEW_STUDIES.checkedAt);
  });
});

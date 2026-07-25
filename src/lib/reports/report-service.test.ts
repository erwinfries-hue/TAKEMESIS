import { describe, expect, it } from "vitest";
import { InMemoryReportRepository } from "./in-memory-report-repository";
import { InvalidReportTransitionError } from "./lifecycle";
import { ReportNotFoundError, transitionReportStatus } from "./report-service";

async function createTestReport(repository: InMemoryReportRepository) {
  return repository.create({
    tokenHash: "hash123",
    originalQuestion: "Welche Lernmethode verbessert den Lernerfolg?",
    locale: "de",
    domainSlug: "lernen-bildung",
    eligibility: "eligible",
    priceVersion: "MVP-01",
  });
}

describe("transitionReportStatus", () => {
  it("moves a report through the happy path one valid step at a time", async () => {
    const repository = new InMemoryReportRepository();
    const report = await createTestReport(repository);
    expect(report.status).toBe("draft");

    const step1 = await transitionReportStatus(repository, report.id, "preview_ready");
    expect(step1.status).toBe("preview_ready");

    const step2 = await transitionReportStatus(repository, report.id, "checkout_started");
    expect(step2.status).toBe("checkout_started");
  });

  it("rejects an invalid transition and leaves the stored status unchanged", async () => {
    const repository = new InMemoryReportRepository();
    const report = await createTestReport(repository);

    await expect(
      transitionReportStatus(repository, report.id, "ready"),
    ).rejects.toBeInstanceOf(InvalidReportTransitionError);

    const stillDraft = await repository.findById(report.id);
    expect(stillDraft?.status).toBe("draft");
  });

  it("throws ReportNotFoundError for an unknown report id", async () => {
    const repository = new InMemoryReportRepository();
    await expect(
      transitionReportStatus(repository, "does-not-exist", "preview_ready"),
    ).rejects.toBeInstanceOf(ReportNotFoundError);
  });

  it("persists extra fields alongside the status change", async () => {
    const repository = new InMemoryReportRepository();
    const report = await createTestReport(repository);
    await transitionReportStatus(repository, report.id, "preview_ready");
    const updated = await transitionReportStatus(repository, report.id, "checkout_started", {
      stripeCheckoutSessionId: "cs_test_123",
    });
    expect(updated.stripeCheckoutSessionId).toBe("cs_test_123");
  });
});

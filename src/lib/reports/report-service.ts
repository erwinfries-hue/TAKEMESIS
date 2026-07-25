import { assertTransition, type ReportStatus } from "./lifecycle";
import type { ReportRepository } from "./report-repository";
import type { Report } from "./types";

export class ReportNotFoundError extends Error {
  constructor(readonly reportId: string) {
    super(`Report ${reportId} not found`);
    this.name = "ReportNotFoundError";
  }
}

/**
 * The only sanctioned way to change a report's status: looks up the current
 * status, validates the transition against the lifecycle state machine, and
 * only then persists it. Both the in-memory and Supabase repositories stay
 * plain persistence adapters — this is the single choke point that enforces
 * the invariant regardless of which one is in use.
 */
export async function transitionReportStatus(
  repository: ReportRepository,
  reportId: string,
  toStatus: ReportStatus,
  extraPatch: Partial<Omit<Report, "id" | "createdAt" | "status">> = {},
): Promise<Report> {
  const report = await repository.findById(reportId);
  if (!report) {
    throw new ReportNotFoundError(reportId);
  }
  assertTransition(report.status, toStatus);
  return repository.update(reportId, { ...extraPatch, status: toStatus });
}

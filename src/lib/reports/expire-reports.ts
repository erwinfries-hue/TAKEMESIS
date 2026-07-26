import "server-only";
import { transitionReportStatus } from "./report-service";
import { isPastExpiry } from "./retention";
import type { ReportRepository } from "./report-repository";

export interface ExpireReportsResult {
  checked: number;
  expired: string[];
}

/**
 * Decision #5: scans "ready" reports past their `expiresAt` and transitions
 * them to "expired" via the lifecycle state machine. Called by the cron
 * route handler; kept repository-agnostic so it's testable against the
 * in-memory repository without a real database. (The secure-link report
 * viewer that would read this status back is not yet built — see
 * docs/OPEN_RISKS.md.)
 */
export async function expireDueReports(
  repository: ReportRepository,
  now: Date = new Date(),
): Promise<ExpireReportsResult> {
  const allReports = await repository.listAll();
  const dueReports = allReports.filter(
    (report) => report.status === "ready" && isPastExpiry(report.expiresAt, now),
  );

  const expired: string[] = [];
  for (const report of dueReports) {
    await transitionReportStatus(repository, report.id, "expired");
    expired.push(report.id);
  }

  return { checked: allReports.length, expired };
}

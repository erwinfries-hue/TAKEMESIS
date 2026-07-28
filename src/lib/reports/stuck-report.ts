import type { Report } from "./types";

/**
 * A report generation normally finishes in well under a minute (live-verified
 * this session: a real paid checkout produced a 46-study report in roughly
 * 15-20s). 30 minutes stuck in "paid" (fulfillment never started/resumed) or
 * "processing" (started but never reached "ready"/"failed") is a strong
 * signal of the residual gap documented in OPEN_RISKS.md — a webhook
 * delivery interrupted after the event was recorded as seen but before
 * markProcessed(), which currently has no automatic recovery path.
 */
export const STUCK_REPORT_THRESHOLD_MINUTES = 30;

const STUCK_STATUSES: ReadonlySet<Report["status"]> = new Set(["paid", "processing"]);

export function isReportStuck(
  report: Pick<Report, "status" | "updatedAt">,
  now: Date = new Date(),
  thresholdMinutes: number = STUCK_REPORT_THRESHOLD_MINUTES,
): boolean {
  if (!STUCK_STATUSES.has(report.status)) {
    return false;
  }
  const ageMs = now.getTime() - new Date(report.updatedAt).getTime();
  return ageMs > thresholdMinutes * 60_000;
}

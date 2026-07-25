/**
 * Report lifecycle state machine — docs/09_MONETIZATION_STRIPE_AND_REPORT_LIFECYCLE.md.
 * Pure and side-effect-free so it's fully unit-testable without a database;
 * repositories call `assertTransition` before persisting a status change.
 */
export type ReportStatus =
  | "draft"
  | "preview_ready"
  | "checkout_started"
  | "paid"
  | "processing"
  | "ready"
  | "failed"
  | "refund_pending"
  | "refunded"
  | "blocked"
  | "expired";

const TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  draft: ["preview_ready", "blocked"],
  preview_ready: ["checkout_started", "blocked"],
  checkout_started: ["paid", "expired", "blocked"],
  paid: ["processing", "blocked"],
  // "permanent failure becomes refund_pending" (docs/09) — processing can
  // also be blocked directly if an admin needs to intervene mid-generation.
  processing: ["ready", "failed", "blocked"],
  ready: ["blocked", "refund_pending"],
  failed: ["refund_pending"],
  refund_pending: ["refunded"],
  refunded: [],
  blocked: ["refund_pending"],
  expired: [],
};

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidReportTransitionError extends Error {
  readonly from: ReportStatus;
  readonly to: ReportStatus;

  constructor(from: ReportStatus, to: ReportStatus) {
    super(`Cannot transition report from "${from}" to "${to}"`);
    this.name = "InvalidReportTransitionError";
    this.from = from;
    this.to = to;
  }
}

export function assertTransition(from: ReportStatus, to: ReportStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidReportTransitionError(from, to);
  }
}

export function isTerminalStatus(status: ReportStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/**
 * Decision #5 (docs/DECISIONS_LOG.md): paid reports remain accessible for
 * REPORT_RETENTION_MONTHS (default 12) after becoming "paid", then are
 * automatically expired. Pure and side-effect-free; `expireDueReports` below
 * is the only piece that touches a repository.
 */
export function computeReportExpiry(paidAt: Date, retentionMonths: number): Date {
  const expiry = new Date(paidAt);
  expiry.setUTCMonth(expiry.getUTCMonth() + retentionMonths);
  return expiry;
}

export function isPastExpiry(expiresAt: string | null, now: Date): boolean {
  if (!expiresAt) {
    return false;
  }
  return new Date(expiresAt).getTime() <= now.getTime();
}

export function orNotReported(value: string | null, notReportedLabel: string): string {
  return value ?? notReportedLabel;
}

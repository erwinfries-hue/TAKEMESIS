import { describe, expect, it } from "vitest";
import { isReportStuck } from "./stuck-report";

const NOW = new Date("2026-07-28T12:00:00.000Z");

function reportAt(status: "paid" | "processing" | "ready", minutesAgo: number) {
  return {
    status,
    updatedAt: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString(),
  };
}

describe("isReportStuck", () => {
  it("flags a report that has been 'paid' for over 30 minutes", () => {
    expect(isReportStuck(reportAt("paid", 45), NOW)).toBe(true);
  });

  it("flags a report that has been 'processing' for over 30 minutes", () => {
    expect(isReportStuck(reportAt("processing", 31), NOW)).toBe(true);
  });

  it("does not flag a report still within the threshold", () => {
    expect(isReportStuck(reportAt("paid", 5), NOW)).toBe(false);
    expect(isReportStuck(reportAt("processing", 29), NOW)).toBe(false);
  });

  it("does not flag statuses other than paid/processing, regardless of age", () => {
    expect(isReportStuck(reportAt("ready", 999), NOW)).toBe(false);
  });

  it("respects a custom threshold", () => {
    expect(isReportStuck(reportAt("paid", 10), NOW, 5)).toBe(true);
    expect(isReportStuck(reportAt("paid", 10), NOW, 20)).toBe(false);
  });
});

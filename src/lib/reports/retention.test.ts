import { describe, expect, it } from "vitest";
import { computeReportExpiry, isPastExpiry } from "./retention";

describe("computeReportExpiry", () => {
  it("adds the retention period in months", () => {
    const paidAt = new Date("2026-07-26T10:00:00.000Z");
    const expiry = computeReportExpiry(paidAt, 12);
    expect(expiry.toISOString()).toBe("2027-07-26T10:00:00.000Z");
  });

  it("supports a non-default retention period", () => {
    const paidAt = new Date("2026-01-15T00:00:00.000Z");
    const expiry = computeReportExpiry(paidAt, 6);
    expect(expiry.toISOString()).toBe("2026-07-15T00:00:00.000Z");
  });

  it("does not mutate the input date", () => {
    const paidAt = new Date("2026-07-26T10:00:00.000Z");
    computeReportExpiry(paidAt, 12);
    expect(paidAt.toISOString()).toBe("2026-07-26T10:00:00.000Z");
  });
});

describe("isPastExpiry", () => {
  it("is false when expiresAt is null (not yet paid/ready)", () => {
    expect(isPastExpiry(null, new Date())).toBe(false);
  });

  it("is false when expiresAt is in the future", () => {
    expect(isPastExpiry("2099-01-01T00:00:00.000Z", new Date("2026-07-26T00:00:00.000Z"))).toBe(
      false,
    );
  });

  it("is true when expiresAt is in the past", () => {
    expect(isPastExpiry("2020-01-01T00:00:00.000Z", new Date("2026-07-26T00:00:00.000Z"))).toBe(
      true,
    );
  });

  it("is true when expiresAt is exactly now", () => {
    const now = new Date("2026-07-26T00:00:00.000Z");
    expect(isPastExpiry(now.toISOString(), now)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { inferPublicationType } from "./publication-type";

describe("inferPublicationType", () => {
  it("detects meta-analyses", () => {
    expect(inferPublicationType("A Meta-Analysis of Spaced Repetition")).toBe("meta_analysis");
  });

  it("detects systematic reviews", () => {
    expect(inferPublicationType("A Systematic Review of Active Recall")).toBe(
      "systematic_review",
    );
  });

  it("detects RCTs by full phrase or acronym", () => {
    expect(inferPublicationType("A Randomized Controlled Trial of X")).toBe("rct");
    expect(inferPublicationType("An RCT of X")).toBe("rct");
  });

  it("detects cohort studies", () => {
    expect(inferPublicationType("A Prospective Cohort Study")).toBe("cohort");
  });

  it("falls back to generic review before returning unknown", () => {
    expect(inferPublicationType("A Narrative Review of Sleep")).toBe("review");
  });

  it("returns unknown when nothing matches, never guessing", () => {
    expect(inferPublicationType("Effects of Interleaving on Retention")).toBe("unknown");
  });

  it("combines multiple text fields", () => {
    expect(inferPublicationType(null, "Study Design", "a case-control study")).toBe(
      "case_control",
    );
  });
});

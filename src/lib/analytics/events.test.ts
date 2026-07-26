import { describe, expect, it } from "vitest";
import { sanitizeMetadata } from "./events";

describe("sanitizeMetadata", () => {
  it("keeps allowlisted keys", () => {
    expect(sanitizeMetadata({ topicSlug: "lernen-bildung", eligibilityStatus: "eligible" })).toEqual({
      topicSlug: "lernen-bildung",
      eligibilityStatus: "eligible",
    });
  });

  it("drops any key not on the allowlist — the structural guard against raw question leakage", () => {
    expect(
      sanitizeMetadata({
        topicSlug: "lernen-bildung",
        question: "Welche Lernmethode verbessert den Lernerfolg?",
        originalQuestion: "some sensitive health question",
        notes: "free text a developer might add later",
      }),
    ).toEqual({ topicSlug: "lernen-bildung" });
  });

  it("returns an empty object for undefined metadata", () => {
    expect(sanitizeMetadata(undefined)).toEqual({});
  });
});

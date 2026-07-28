import { describe, expect, it } from "vitest";
import { describeUnknownError } from "./describe-unknown-error";

describe("describeUnknownError", () => {
  it("returns the message of a real Error instance", () => {
    expect(describeUnknownError(new Error("boom"))).toBe("boom");
  });

  it("returns the message of a duck-typed error object (e.g. PostgrestError)", () => {
    expect(
      describeUnknownError({ message: "Invalid API key", code: "401", details: null, hint: null }),
    ).toBe("Invalid API key");
  });

  it("falls back to JSON.stringify for a plain object without a message", () => {
    expect(describeUnknownError({ code: "PGRST301" })).toBe('{"code":"PGRST301"}');
  });

  it("falls back to String() for a primitive", () => {
    expect(describeUnknownError("plain string error")).toBe('"plain string error"');
    expect(describeUnknownError(42)).toBe("42");
  });
});

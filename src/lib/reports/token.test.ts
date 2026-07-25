import { describe, expect, it } from "vitest";
import { generateReportToken, hashReportToken } from "./token";

describe("generateReportToken", () => {
  it("produces a token whose hash matches hashReportToken(token)", () => {
    const { token, tokenHash } = generateReportToken();
    expect(hashReportToken(token)).toBe(tokenHash);
  });

  it("produces a URL-safe token (no +, /, or = characters)", () => {
    const { token } = generateReportToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces different tokens on each call", () => {
    const a = generateReportToken();
    const b = generateReportToken();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it("has enough entropy to be non-guessable (at least 32 chars)", () => {
    const { token } = generateReportToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
  });
});

describe("hashReportToken", () => {
  it("is deterministic", () => {
    expect(hashReportToken("same-input")).toBe(hashReportToken("same-input"));
  });

  it("produces a 64-character hex SHA-256 digest", () => {
    expect(hashReportToken("x")).toMatch(/^[0-9a-f]{64}$/);
  });
});

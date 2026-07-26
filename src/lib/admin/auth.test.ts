import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    ADMIN_EMAILS: "admin@tekmesis.com, Second.Admin@tekmesis.com",
    ADMIN_AUTH_SECRET: "test-secret-value",
  },
}));

import {
  createAdminSessionValue,
  isAllowedAdminEmail,
  verifyAdminCredentials,
  verifyAdminSessionValue,
} from "./auth";

describe("isAllowedAdminEmail", () => {
  it("accepts an allowlisted email case-insensitively", () => {
    expect(isAllowedAdminEmail("admin@tekmesis.com")).toBe(true);
    expect(isAllowedAdminEmail("ADMIN@tekmesis.com")).toBe(true);
    expect(isAllowedAdminEmail("second.admin@tekmesis.com")).toBe(true);
  });

  it("rejects an email not on the allowlist", () => {
    expect(isAllowedAdminEmail("random@example.com")).toBe(false);
  });
});

describe("verifyAdminCredentials", () => {
  it("accepts the correct secret for an allowlisted email", () => {
    expect(verifyAdminCredentials("admin@tekmesis.com", "test-secret-value")).toBe(true);
  });

  it("rejects a wrong secret", () => {
    expect(verifyAdminCredentials("admin@tekmesis.com", "wrong-secret")).toBe(false);
  });

  it("rejects a correct secret for a non-allowlisted email", () => {
    expect(verifyAdminCredentials("random@example.com", "test-secret-value")).toBe(false);
  });
});

describe("createAdminSessionValue / verifyAdminSessionValue", () => {
  it("round-trips: a session created for an allowlisted email verifies back to that email", () => {
    const session = createAdminSessionValue("admin@tekmesis.com");
    expect(verifyAdminSessionValue(session)).toBe("admin@tekmesis.com");
  });

  it("preserves emails containing dots correctly (delimiter must not collide with '.')", () => {
    const session = createAdminSessionValue("second.admin@tekmesis.com");
    expect(verifyAdminSessionValue(session)).toBe("second.admin@tekmesis.com");
  });

  it("rejects a missing or malformed cookie value", () => {
    expect(verifyAdminSessionValue(undefined)).toBeNull();
    expect(verifyAdminSessionValue("not-a-valid-session")).toBeNull();
  });

  it("rejects a forged session with a tampered signature", () => {
    const session = createAdminSessionValue("admin@tekmesis.com");
    const tampered = session.slice(0, -1) + (session.endsWith("0") ? "1" : "0");
    expect(verifyAdminSessionValue(tampered)).toBeNull();
  });

  it("rejects a session for an email that was removed from the allowlist", () => {
    const forgedButUnlisted = "attacker@example.com|whatever-signature";
    expect(verifyAdminSessionValue(forgedButUnlisted)).toBeNull();
  });
});

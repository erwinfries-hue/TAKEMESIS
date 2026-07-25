import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canTransition,
  InvalidReportTransitionError,
  isTerminalStatus,
  type ReportStatus,
} from "./lifecycle";

describe("canTransition", () => {
  it("allows the documented happy path from draft to ready", () => {
    const path: ReportStatus[] = [
      "draft",
      "preview_ready",
      "checkout_started",
      "paid",
      "processing",
      "ready",
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it("allows a permanently failed report to become refund_pending, then refunded", () => {
    expect(canTransition("processing", "failed")).toBe(true);
    expect(canTransition("failed", "refund_pending")).toBe(true);
    expect(canTransition("refund_pending", "refunded")).toBe(true);
  });

  it("rejects skipping straight from draft to paid (no unlock-from-redirect-alone)", () => {
    expect(canTransition("draft", "paid")).toBe(false);
  });

  it("rejects moving backwards", () => {
    expect(canTransition("paid", "draft")).toBe(false);
    expect(canTransition("ready", "processing")).toBe(false);
  });

  it("treats refunded and expired as terminal", () => {
    expect(isTerminalStatus("refunded")).toBe(true);
    expect(isTerminalStatus("expired")).toBe(true);
    expect(canTransition("refunded", "draft")).toBe(false);
  });

  it("allows blocking from most non-terminal states, and blocked reports can only move to refund_pending", () => {
    expect(canTransition("paid", "blocked")).toBe(true);
    expect(canTransition("ready", "blocked")).toBe(true);
    expect(canTransition("blocked", "refund_pending")).toBe(true);
    expect(canTransition("blocked", "ready")).toBe(false);
  });
});

describe("assertTransition", () => {
  it("does not throw for a valid transition", () => {
    expect(() => assertTransition("draft", "preview_ready")).not.toThrow();
  });

  it("throws InvalidReportTransitionError for an invalid one", () => {
    expect(() => assertTransition("draft", "ready")).toThrow(InvalidReportTransitionError);
  });
});

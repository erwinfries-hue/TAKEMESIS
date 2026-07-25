import { describe, expect, it } from "vitest";

describe("server env module", () => {
  it("loads and validates against real process.env without throwing", async () => {
    const { serverEnv } = await import("@/lib/env/server");
    expect(serverEnv.STRIPE_MODE).toBe("test");
    expect(serverEnv.REPORT_PRICE_MINOR).toBe(990);
    expect(serverEnv.NCBI_TOOL).toBe("TEKMESIS");
  });
});

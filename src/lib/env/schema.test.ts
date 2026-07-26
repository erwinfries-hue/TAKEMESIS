import { describe, expect, it } from "vitest";
import { clientEnvSchema, serverEnvSchema } from "./schema";

describe("clientEnvSchema", () => {
  it("applies documented defaults when nothing is set", () => {
    const result = clientEnvSchema.parse({});
    expect(result.NEXT_PUBLIC_APP_NAME).toBe("TEKMESIS");
    expect(result.NEXT_PUBLIC_APP_BASE_URL).toBe("http://localhost:3000");
    expect(result.NEXT_PUBLIC_AXIA4_DIGITAL_URL).toBe("https://axia4.ch/digital");
    expect(result.NEXT_PUBLIC_ANALYTICS_ENABLED).toBe(false);
  });

  it("coerces the analytics-enabled flag from a string", () => {
    const result = clientEnvSchema.parse({ NEXT_PUBLIC_ANALYTICS_ENABLED: "true" });
    expect(result.NEXT_PUBLIC_ANALYTICS_ENABLED).toBe(true);
  });

  it("rejects a malformed base URL", () => {
    const result = clientEnvSchema.safeParse({ NEXT_PUBLIC_APP_BASE_URL: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("serverEnvSchema", () => {
  it("applies the decided defaults matching FINAL_CONCEPT_DECISIONS.md", () => {
    const result = serverEnvSchema.parse({});
    expect(result.REPORT_PRICE_MINOR).toBe(990);
    expect(result.REPORT_CURRENCY).toBe("CHF");
    expect(result.REPORT_PRICE_VERSION).toBe("MVP-01");
    expect(result.STRIPE_MODE).toBe("test");
    expect(result.FREE_SEARCH_LIMIT).toBe(5);
    expect(result.SUPPORT_EMAIL).toBe("support@tekmesis.com");
    expect(result.EMAIL_PROVIDER).toBe("resend");
    expect(result.REPORT_RETENTION_MONTHS).toBe(12);
    expect(result.AI_MODEL).toBe("claude-haiku-4-5-20251001");
  });

  it("only accepts test or live for STRIPE_MODE", () => {
    const result = serverEnvSchema.safeParse({ STRIPE_MODE: "sandbox" });
    expect(result.success).toBe(false);
  });

  it("coerces numeric AI cost-control vars from strings", () => {
    const result = serverEnvSchema.parse({
      AI_MAX_INPUT_CHARS: "12000",
      AI_TIMEOUT_MS: "5000",
      AI_MAX_RETRIES: "1",
    });
    expect(result.AI_MAX_INPUT_CHARS).toBe(12000);
    expect(result.AI_TIMEOUT_MS).toBe(5000);
    expect(result.AI_MAX_RETRIES).toBe(1);
  });
});

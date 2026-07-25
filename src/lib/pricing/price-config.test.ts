import { describe, expect, it } from "vitest";
import { formatPrice, getPriceConfig } from "./price-config";

describe("getPriceConfig", () => {
  it("reads decision #9's CHF 9.90 / MVP-01 default from server env", () => {
    const config = getPriceConfig();
    expect(config.amountMinor).toBe(990);
    expect(config.currency).toBe("CHF");
    expect(config.version).toBe("MVP-01");
  });
});

describe("formatPrice", () => {
  it("formats the minor-unit amount as a currency string containing 9.90 and CHF", () => {
    const formatted = formatPrice({ amountMinor: 990, currency: "CHF", version: "MVP-01" });
    expect(formatted).toContain("9.90");
    expect(formatted).toContain("CHF");
  });

  it("works for other amounts too", () => {
    const formatted = formatPrice({ amountMinor: 500, currency: "CHF", version: "TEST" });
    expect(formatted).toContain("5.00");
  });
});

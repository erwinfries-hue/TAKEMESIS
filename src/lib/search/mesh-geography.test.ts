import { describe, expect, it } from "vitest";
import { deriveStudyRegion } from "./mesh-geography";

describe("deriveStudyRegion", () => {
  it("matches a country-level MeSH heading to its broad region", () => {
    expect(deriveStudyRegion(["Humans", "Germany", "Sleep"])).toBe("europe");
    expect(deriveStudyRegion(["Brazil"])).toBe("latin_america");
    expect(deriveStudyRegion(["China"])).toBe("asia");
    expect(deriveStudyRegion(["Nigeria"])).toBe("africa");
    expect(deriveStudyRegion(["Australia"])).toBe("oceania");
    expect(deriveStudyRegion(["Saudi Arabia"])).toBe("middle_east");
    expect(deriveStudyRegion(["United States"])).toBe("north_america");
  });

  it("matches a continent/sub-region-level MeSH heading directly", () => {
    expect(deriveStudyRegion(["Scandinavian and Nordic Countries"])).toBe("europe");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(deriveStudyRegion([" germany "])).toBe("europe");
    expect(deriveStudyRegion(["GERMANY"])).toBe("europe");
  });

  it("returns null when no heading is undefined, empty, or has no geographic term (never guessed)", () => {
    expect(deriveStudyRegion(undefined)).toBeNull();
    expect(deriveStudyRegion([])).toBeNull();
    expect(deriveStudyRegion(["Humans", "Randomized Controlled Trials as Topic"])).toBeNull();
  });

  it("returns the first matching region when multiple geographic headings are present", () => {
    expect(deriveStudyRegion(["Germany", "France"])).toBe("europe");
  });
});

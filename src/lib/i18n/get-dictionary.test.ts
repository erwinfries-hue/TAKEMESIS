import { describe, expect, it } from "vitest";
import { getDictionary } from "./get-dictionary";

describe("getDictionary", () => {
  it("returns matching brand identity for both locales", () => {
    const de = getDictionary("de");
    const en = getDictionary("en");
    expect(de.brand.name).toBe("TEKMESIS");
    expect(en.brand.name).toBe("TEKMESIS");
    expect(de.brand.claim).toBe(en.brand.claim);
  });

  it("returns localized copy, not a shared reference", () => {
    const de = getDictionary("de");
    const en = getDictionary("en");
    expect(de.home.description).not.toBe(en.home.description);
    expect(de.footer.disclaimer).not.toBe(en.footer.disclaimer);
  });
});

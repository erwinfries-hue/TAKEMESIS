import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildStructuredData } from "./structured-data";

describe("buildStructuredData", () => {
  it("includes an Organization and a WebSite entry in the @graph", () => {
    const dict = getDictionary("de");
    const data = buildStructuredData("https://tekmesis.com", dict);

    expect(data["@context"]).toBe("https://schema.org");
    const types = data["@graph"].map((entry) => entry["@type"]);
    expect(types).toEqual(["Organization", "WebSite"]);
  });

  it("uses the given base URL for url/logo fields, not a hardcoded one", () => {
    const dict = getDictionary("de");
    const data = buildStructuredData("https://tekmesis.com", dict);
    const organization = data["@graph"][0];

    expect(organization.url).toBe("https://tekmesis.com");
    expect(organization.logo).toBe("https://tekmesis.com/icon.svg");
  });

  it("reuses the real brand name and homepage description rather than inventing copy", () => {
    const dict = getDictionary("de");
    const data = buildStructuredData("https://tekmesis.com", dict);

    for (const entry of data["@graph"]) {
      expect(entry.name).toBe(dict.brand.name);
      expect(entry.description).toBe(dict.home.description);
    }
  });

  it("references AXIA4 as the parent organization", () => {
    const dict = getDictionary("de");
    const data = buildStructuredData("https://tekmesis.com", dict);
    const organization = data["@graph"][0];

    expect(organization.parentOrganization).toEqual({
      "@type": "Organization",
      name: "AXIA4",
      url: "https://axia4.ch/digital",
    });
  });

  it("never fabricates a Product/Offer/aggregateRating (no rating data actually exists)", () => {
    const dict = getDictionary("de");
    const data = buildStructuredData("https://tekmesis.com", dict);
    const serialized = JSON.stringify(data);

    expect(serialized).not.toContain("aggregateRating");
    expect(serialized).not.toContain("Product");
  });
});

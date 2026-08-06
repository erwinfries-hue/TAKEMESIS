import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * Organization + WebSite JSON-LD, combined via @graph into one script tag.
 * Deliberately minimal: no Product/Offer/aggregateRating — TEKMESIS sells a
 * per-question report, not a fixed catalog product, and there are no real
 * reviews to report. Inventing either would violate the evidence-integrity
 * rule against fabricated data, so this only states facts that already
 * exist elsewhere in the app (brand name, URL, description, parent org).
 */
export function buildStructuredData(baseUrl: string, dict: Dictionary) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: dict.brand.name,
        url: baseUrl,
        logo: `${baseUrl}/icon.svg`,
        description: dict.home.description,
        parentOrganization: {
          "@type": "Organization",
          name: "AXIA4",
          url: "https://axia4.ch/digital",
        },
      },
      {
        "@type": "WebSite",
        name: dict.brand.name,
        url: baseUrl,
        description: dict.home.description,
      },
    ],
  };
}

import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env/client";
import { locales } from "@/lib/i18n/config";
import { buildLocaleAlternates } from "@/lib/i18n/metadata";

/**
 * Only the evergreen, publicly indexable pages — deliberately excludes
 * /search (per-visitor query string), /report/[token] (private purchased
 * content), /checkout/* (transactional), and /admin/* (auth-gated). Those
 * also carry their own `robots: { index: false }` metadata; see robots.ts.
 *
 * Path-based i18n (src/app/[locale]/...): each route gets one sitemap entry
 * per locale, with hreflang alternates pointing at its sibling-language
 * URLs plus x-default — see lib/i18n/metadata.ts.
 */
const STATIC_ROUTES = [
  "/",
  "/topics",
  "/methodology",
  "/sources",
  "/example-report",
  "/about",
  "/privacy",
  "/legal",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = clientEnv.NEXT_PUBLIC_APP_BASE_URL;

  return STATIC_ROUTES.flatMap((route) =>
    locales.map((locale) => {
      const { canonical, languages } = buildLocaleAlternates(locale, route);
      return {
        url: `${baseUrl}${canonical}`,
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(
            Object.entries(languages).map(([lang, path]) => [lang, `${baseUrl}${path}`]),
          ),
        },
      };
    }),
  );
}

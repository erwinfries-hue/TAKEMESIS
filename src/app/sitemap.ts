import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env/client";

/**
 * Only the evergreen, publicly indexable pages — deliberately excludes
 * /search (per-visitor query string), /report/[token] (private purchased
 * content), /checkout/* (transactional), and /admin/* (auth-gated). Those
 * also carry their own `robots: { index: false }` metadata; see robots.ts.
 *
 * No locale-specific URLs: TEKMESIS's i18n is cookie-based, not
 * path-based (see lib/i18n/locale.ts), so there is exactly one URL per
 * page regardless of language — hreflang alternates would have nothing
 * distinct to point to and are deliberately not added here.
 */
const STATIC_ROUTES = [
  "",
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
  return STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}

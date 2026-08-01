import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env/client";

/**
 * Disallow rules are defense-in-depth (crawl-budget hygiene) alongside the
 * per-page `robots: { index: false }` metadata on /admin, /checkout,
 * /report/[token], and /search — that metadata is what actually keeps a
 * URL out of the index even if it's discovered via a link robots.txt never
 * saw; this file only tells crawlers not to bother requesting these paths.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/checkout", "/report", "/search"],
    },
    sitemap: `${clientEnv.NEXT_PUBLIC_APP_BASE_URL}/sitemap.xml`,
  };
}

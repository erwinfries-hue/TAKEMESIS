import { locales, type Locale } from "./config";

/**
 * Canonical + hreflang alternates for a locale-prefixed marketing page.
 * `path` is the root-relative, locale-free path (e.g. "/topics", or "/" for
 * the homepage) — the same path used for every locale's version of the page.
 */
export function buildLocaleAlternates(
  locale: Locale,
  path: string,
): { canonical: string; languages: Record<string, string> } {
  const withLocale = (l: Locale) => (path === "/" ? `/${l}` : `/${l}${path}`);

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = withLocale(l);
  }
  // No locale reliably represents "unspecified" for a DACH-first product —
  // German is the deterministic default everywhere else (see locale.ts), so
  // it's also the x-default target here.
  languages["x-default"] = withLocale("de");

  return { canonical: withLocale(locale), languages };
}

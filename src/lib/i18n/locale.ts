import "server-only";
import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, localeHeaderName, type Locale } from "./config";

/**
 * Locale-prefixed pages (src/app/[locale]/...) are authoritative via the URL
 * itself — middleware.ts detects the /de|/en|/fr segment and forwards it as
 * the `x-locale` header, read first here. Pages outside that segment
 * (search, checkout, report/[token], admin — deliberately unprefixed, see
 * middleware.ts) have no URL-derived locale, so they fall back to the
 * `tekmesis_locale` cookie, which middleware also refreshes on every
 * locale-prefixed request so it never drifts from the visitor's last
 * explicit choice. No Accept-Language sniffing: TEKMESIS's initial market is
 * DACH, so the deterministic default is German absent either signal.
 */
export async function getLocale(): Promise<Locale> {
  const headerLocale = (await headers()).get(localeHeaderName);
  if (headerLocale && isLocale(headerLocale)) {
    return headerLocale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return defaultLocale;
}

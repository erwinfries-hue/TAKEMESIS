import "server-only";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "./config";

/**
 * Deliberately cookie-only (no Accept-Language sniffing): TEKMESIS's initial
 * market is DACH, so the deterministic default is German until the visitor
 * explicitly switches via LocaleSwitcher, which persists the choice in the
 * `tekmesis_locale` cookie.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return defaultLocale;
}

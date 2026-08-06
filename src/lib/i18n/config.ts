export const locales = ["de", "en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";

export const localeCookieName = "tekmesis_locale";

/** Set by middleware.ts from the request's /de|/en|/fr URL segment, read by getLocale() (lib/i18n/locale.ts). Lives here, not in locale.ts, so middleware (edge runtime) can import the name without pulling in "server-only". */
export const localeHeaderName = "x-locale";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Prefixes a root-relative path with the locale segment, e.g. ("de", "/topics") -> "/de/topics", ("de", "/") -> "/de". */
export function localizedPath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export const locales = ["de", "en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";

export const localeCookieName = "tekmesis_locale";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

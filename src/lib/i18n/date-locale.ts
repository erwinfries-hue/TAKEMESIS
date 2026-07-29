import type { Locale } from "@/lib/i18n/config";

/**
 * Shared BCP-47 locale tags for Intl.* date/time formatting — kept in one
 * place since the de-CH/en-CH/fr-CH mapping is otherwise duplicated
 * identically across every component that formats a date or time.
 */
export const INTL_DATE_LOCALE: Record<Locale, string> = {
  de: "de-CH",
  en: "en-CH",
  fr: "fr-CH",
};

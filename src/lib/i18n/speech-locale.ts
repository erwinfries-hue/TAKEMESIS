import type { Locale } from "@/lib/i18n/config";

/**
 * BCP-47 tags for the Web Speech API (SpeechRecognition lang / SpeechSynthesisUtterance.lang).
 * Kept separate from INTL_DATE_LOCALE since speech engines have different
 * regional-variant support than Intl.DateTimeFormat (e.g. "en-US" over "en-CH").
 */
export const SPEECH_LOCALE: Record<Locale, string> = {
  de: "de-CH",
  en: "en-US",
  fr: "fr-CH",
};

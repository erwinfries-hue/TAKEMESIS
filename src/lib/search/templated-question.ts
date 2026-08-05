import type { Locale } from "@/lib/i18n/config";

/**
 * Zero-cost alternative to the AI researchability check for cost-conscious
 * users (Erwin, 2026-08-05, same-day follow-up to the researchability gate):
 * a fixed "Welchen Effekt hat X auf Y?" template, chosen because it already
 * matches a live-verified example question and always hits the researchability
 * fast path (see RESEARCHABLE_SIGNAL_TERMS) — never falls through to an AI call.
 */
const QUESTION_TEMPLATE: Record<Locale, (measure: string, outcome: string) => string> = {
  de: (measure, outcome) => `Welchen Effekt hat ${measure} auf ${outcome}?`,
  en: (measure, outcome) => `What effect does ${measure} have on ${outcome}?`,
  fr: (measure, outcome) => `Quel effet ${measure} a-t-il sur ${outcome} ?`,
};

export function assembleTemplatedQuestion(
  measure: string,
  outcome: string,
  locale: Locale,
): string | null {
  const trimmedMeasure = measure.trim();
  const trimmedOutcome = outcome.trim();
  if (!trimmedMeasure || !trimmedOutcome) {
    return null;
  }
  return QUESTION_TEMPLATE[locale](trimmedMeasure, trimmedOutcome);
}

import type { Locale } from "@/lib/i18n/config";
import type { LearnedTerm } from "./types";

export interface LearnedTermRepository {
  /** Batch lookup so translating a whole question costs one round trip, not one per unknown token. */
  findMany(locale: Locale, terms: string[]): Promise<Map<string, string>>;
  /** Creates the term on first sight, or overwrites the translation on a repeat AI call for the same (locale, term). */
  upsert(locale: Locale, term: string, translation: string): Promise<LearnedTerm>;
}

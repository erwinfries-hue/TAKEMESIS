import type { Locale } from "@/lib/i18n/config";

export interface LearnedTerm {
  id: string;
  locale: Locale;
  term: string;
  translation: string;
  createdAt: string;
}

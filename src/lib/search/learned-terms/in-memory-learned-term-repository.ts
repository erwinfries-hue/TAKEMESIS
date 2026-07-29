import { randomUUID } from "node:crypto";
import type { Locale } from "@/lib/i18n/config";
import type { LearnedTermRepository } from "./learned-term-repository";
import type { LearnedTerm } from "./types";

function keyString(locale: Locale, term: string): string {
  return `${locale}:${term}`;
}

/** In-process implementation for tests and local development without a database. */
export class InMemoryLearnedTermRepository implements LearnedTermRepository {
  private readonly terms = new Map<string, LearnedTerm>();

  async findMany(locale: Locale, terms: string[]): Promise<Map<string, string>> {
    const found = new Map<string, string>();
    for (const term of terms) {
      const entry = this.terms.get(keyString(locale, term));
      if (entry) {
        found.set(term, entry.translation);
      }
    }
    return found;
  }

  async upsert(locale: Locale, term: string, translation: string): Promise<LearnedTerm> {
    const k = keyString(locale, term);
    const existing = this.terms.get(k);
    const entry: LearnedTerm = {
      id: existing?.id ?? randomUUID(),
      locale,
      term,
      translation,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    this.terms.set(k, entry);
    return entry;
  }
}

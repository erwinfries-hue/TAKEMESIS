import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { Locale } from "@/lib/i18n/config";
import type { LearnedTermRepository } from "./learned-term-repository";
import type { LearnedTerm } from "./types";

/**
 * Untested against a live database (no Supabase project provisioned in this
 * session — see docs/OPEN_RISKS.md), same caveat as the other Supabase
 * repositories (e.g. supabase-study-cache-repository.ts).
 */
interface LearnedTermRow {
  id: string;
  locale: string;
  term: string;
  translation: string;
  created_at: string;
}

function toDomain(row: LearnedTermRow): LearnedTerm {
  return {
    id: row.id,
    locale: row.locale as Locale,
    term: row.term,
    translation: row.translation,
    createdAt: row.created_at,
  };
}

export class SupabaseLearnedTermRepository implements LearnedTermRepository {
  async findMany(locale: Locale, terms: string[]): Promise<Map<string, string>> {
    const found = new Map<string, string>();
    if (terms.length === 0) {
      return found;
    }
    const { data, error } = await getSupabaseClient()
      .from("learned_search_terms")
      .select()
      .eq("locale", locale)
      .in("term", terms);
    if (error) throw error;
    for (const row of (data ?? []) as LearnedTermRow[]) {
      found.set(row.term, row.translation);
    }
    return found;
  }

  async upsert(locale: Locale, term: string, translation: string): Promise<LearnedTerm> {
    const { data, error } = await getSupabaseClient()
      .from("learned_search_terms")
      .upsert({ locale, term, translation }, { onConflict: "locale,term" })
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as LearnedTermRow);
  }
}

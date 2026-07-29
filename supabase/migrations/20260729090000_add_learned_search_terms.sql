-- Auto-learned search-query term cache (French-locale rollout, 2026-07-29).
-- Not run against a live Supabase project yet — same caveat as the other
-- migrations in this directory (see 20260725220000_init_core_schema.sql's
-- header).
--
-- src/lib/search/fr-en-dictionary.ts is a static, hand-curated FR→EN term
-- list — same role as de-en-dictionary.ts. This table is the second tier:
-- when query-translation.ts hits a French token that's in neither the
-- static dictionary nor this cache, an AI fallback call translates it once
-- and the result is persisted here, so every later occurrence of that same
-- term across any user's question is served for free without a repeat AI
-- call. Locale-scoped (not French-only) so the same mechanism can extend to
-- other locales later without a schema change.

create table learned_search_terms (
  id uuid primary key default gen_random_uuid(),
  locale text not null,
  term text not null,
  translation text not null,
  created_at timestamptz not null default now()
);

-- One learned translation per (locale, term) — a later AI call for the same
-- pair overwrites rather than duplicates (upsert on this constraint).
create unique index learned_search_terms_locale_term_idx on learned_search_terms (locale, term);

alter table learned_search_terms enable row level security;

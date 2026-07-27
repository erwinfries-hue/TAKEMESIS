-- Studies cache (docs/CONCEPT_STUDY_KNOWLEDGE_BASE.md, Phase A). Not run
-- against a live Supabase project yet — same caveat as the other migrations
-- in this directory (see 20260725220000_init_core_schema.sql's header).
--
-- Purely an internal optimization/consistency layer, never a substitute for
-- the live 4-source search (docs/07): bibliographic metadata plus
-- TEKMESIS's own AI-extracted fields, keyed by DOI where present, else by
-- (source, source_id). Deliberately excludes raw abstract text (never
-- persisted anywhere in this app — CLAUDE.md "no copying unlicensed full
-- text") and excludes query-relative fields (relevance score/rank), which
-- only make sense in the context of a specific search, not a cached study.

create table studies (
  id uuid primary key default gen_random_uuid(),
  doi text,
  source text not null,
  source_id text not null,
  title text,
  authors text[] not null default '{}',
  year integer,
  venue text,
  publication_type text not null,
  data_completeness text not null,
  source_url text,

  -- Our own generated content only — never a copy of source material, same
  -- null-stays-null rule as the rest of the product (CLAUDE.md evidence
  -- integrity rules). ai_extracted_at null means not yet extracted.
  ai_population text,
  ai_intervention text,
  ai_outcome text,
  ai_result text,
  ai_uncertainty text,
  ai_limitations text,
  ai_funding_conflicts text,
  ai_extracted_at timestamptz,

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  seen_count integer not null default 1,
  topic_slugs text[] not null default '{}'
);

-- DOI is the primary key when present; falls back to (source, source_id)
-- only for the doi-null case, mirroring the sketch in the concept doc.
create unique index studies_doi_idx on studies (doi) where doi is not null;
create unique index studies_source_key_idx on studies (source, source_id) where doi is null;

alter table studies enable row level security;

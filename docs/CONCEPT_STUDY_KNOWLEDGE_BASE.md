# Concept: A Growing Study Knowledge Base (not a full study index)

Status: **approved and implemented (2026-07-27), Phase A only.** Erwin
approved implementation without waiting for the open questions in §5 to be
answered individually; treat those as still open (particularly #2, the
source-ToS re-check) rather than resolved by this implementation. Scope
delivered:

- `supabase/migrations/20260727090000_add_studies_cache.sql` — the `studies`
  table from §3, exactly as sketched (bibliographic metadata + AI fields
  only, DOI or source+sourceId keyed, no raw abstracts, no query-relative
  fields).
- `src/lib/studies/` — `StudyCacheRepository` interface,
  `InMemoryStudyCacheRepository` (tests), `SupabaseStudyCacheRepository`
  (untested against a live database — no Supabase project provisioned yet,
  same caveat as every other Supabase repository in this codebase).
- `src/lib/ai/report-enrichment.ts` — read-through cache wrapper around
  `extractStudyFields`: cache hit skips the AI call; miss extracts live and
  writes through, fire-and-forget, keyed by `topicSlug` when the caller has
  one. Cache I/O failures are swallowed and logged, never propagated — a
  cache outage degrades to "no caching today," never to a broken or
  fabricated report.
- No change to the live search/screening/eligibility pipeline, no new
  public page — matches §4's non-goals.

Not yet true, and out of scope for this pass: `report-enrichment.ts` is
currently only called from `/example-report` and the admin-only
`/admin/report-preview` preview (task #92's "demo + admin-only preview"
scope) — there is no live paid-report generation job wired up yet, so the
cache has no real production traffic to grow from until that pipeline
exists. The cache is correctly wired for whenever that pipeline is built.

## 1. What was rejected, and why

The original idea — a dynamically updated directory covering *all* studies,
classified by relevant criteria — is not being pursued. Reasoning already
given in chat, restated briefly:

- OpenAlex alone indexes 250M+ works. Building and keeping current a local
  mirror of "all studies" is a data-engineering project on the scale of
  building a competitor to OpenAlex/Crossref/Europe PMC/NCBI, not a feature.
- TEKMESIS's architecture deliberately has no persisted study corpus — every
  search queries the 4 sources live, and the search date shown on every
  report is part of the trust model (`07_EVIDENCE_SOURCES_RETRIEVAL_AND_ELIGIBILITY.md`).
  A large local mirror would need constant re-syncing or go stale, undermining
  exactly that.

## 2. What this proposes instead

Persist a small, **organically growing cache of only the studies TEKMESIS has
already surfaced through real searches** — not an attempt at coverage, purely
a byproduct of normal usage. Every real search still queries all 4 sources
live, unchanged; this cache never substitutes for that, never gates a search,
and is invisible to the search pipeline's correctness. It only ever *shortcuts*
work already done for a study seen before.

### 2.1 What actually gets cached, and why

| Data | Cache it? | Why |
|---|---|---|
| Bibliographic metadata (title, authors, year, venue, DOI, source URL, publication type, data completeness) | Yes | Standard citation metadata; this is what every reference manager and PubMed itself already treats as freely reusable. Low volume, low risk. |
| Raw abstract text | **No** | `NormalizedRecord.abstract` is fetched live today but never persisted anywhere. Caching it long-term reopens exactly the licensing question `CLAUDE.md` already closes ("no copying unlicensed full text") — Crossref/Europe PMC/NCBI terms vary per-article on abstract reuse, and this proposal doesn't need to touch that to deliver its value (see below). Out of scope, permanently, unless a source-by-source licensing review says otherwise. |
| AI-extracted fields (population, intervention, outcome, result, uncertainty, limitations, funding/conflicts) | Yes | This is TEKMESIS's own generated, transformative output — not a copy of source material — same status as what's already shown in every premium report today. This is also where the actual value is (see below). |
| Query-relative data (relevance score, rank, which specific question surfaced it) | No | These are properties of a *question*, not of a *study* — caching them would be meaningless (or misleading) outside the context of the search that produced them. |

### 2.2 Why this is worth doing (the actual value)

1. **AI cost and latency.** Once `AI_EXTRACTION_ENABLED` is live, the same
   frequently-cited study (say, a well-known creatine meta-analysis) can
   surface across many different questions in the same topic. Today, every
   one of those searches re-runs a fresh Anthropic extraction call for the
   same paper. A cache means it's extracted once, reused after that — real
   money saved at any meaningful volume, not a marginal optimization.
2. **Consistency.** Without a cache, if the AI extraction has any run-to-run
   variance, the same study could produce slightly different summarized
   fields across different reports. That's a quiet trust problem (two paying
   customers comparing notes on the same study seeing different "results"
   text). A cache fixes this by construction: one study, one extraction.
3. **Foundation for already-shipped features**, if useful later: the DOI
   lookup ("compare a study you already have") could skip re-fetching from
   Crossref for a DOI already cached; a future "sources TEKMESIS has already
   looked at" transparency page becomes possible without new infrastructure.
   Neither is proposed here — noted only because the cache would make them
   cheap later, which is a reason to build the cache narrowly and well now
   rather than not at all.

### 2.3 Why this doesn't have the scale problem the full version had

Back-of-envelope: even at a generous sustained 2,000 *new, unique* studies
cached per day (accounting for heavy overlap between searches on popular
topics — most searches will hit studies already cached), that's roughly
730,000 rows/year, each a few KB of mostly text. Low single-digit GB/year.
Nowhere near "index everything" territory — this is bounded by actual usage,
not by the size of the scientific literature.

## 3. Data model sketch (illustrative, not final)

```sql
create table studies (
  id uuid primary key default gen_random_uuid(),
  doi text,                          -- null for studies without a DOI
  source text not null,              -- openalex | crossref | europe_pmc | ncbi_pubmed
  source_id text,                    -- source-native ID, used as the key when doi is null
  title text,
  authors text[],
  year integer,
  venue text,
  publication_type text not null,
  data_completeness text not null,
  source_url text,

  -- Our own generated content — never fabricated, same null-stays-null rule
  -- as the rest of the product (CLAUDE.md evidence-integrity rules).
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
  topic_slugs text[] not null default '{}'   -- every topic it's ever surfaced under
);

create unique index studies_doi_idx on studies (doi) where doi is not null;
create unique index studies_source_key_idx on studies (source, source_id) where doi is null;
```

### Integration points (if approved)

- **Write path:** after screening, upsert only *included* records (not raw
  candidates, not excluded ones) into `studies` — keyed by DOI where present,
  else `(source, source_id)`. Bump `last_seen_at`/`seen_count`, merge
  `topic_slugs`.
- **AI read-through cache:** `report-enrichment.ts` checks `studies` for an
  existing `ai_extracted_at` before calling `extractStudyFields()`. Cache hit
  → reuse; miss → extract live, then write through to `studies`.
- No change to the live search pipeline itself, no new gating logic, no
  change to what a report shows — purely an internal optimization layer.

## 4. Explicit non-goals

- Not a replacement for live search — every search still queries all 4
  sources fresh, every time, unchanged.
- Not a browsable "all studies" catalog (v1) — no new public page is
  proposed here.
- Not a retraction-status cache — retraction/screening status must still be
  checked fresh on every real search; this cache only ever holds
  bibliographic facts and our own AI summaries, not eligibility decisions.
- Not personal data in the privacy-rule sense — cached author names are
  public academic authorship metadata about papers, not data about TEKMESIS
  users; doesn't touch `CLAUDE.md`'s "no unnecessary personal data" rule.

## 5. Open questions for Erwin (need answers before implementation)

1. **Scope approval:** agree to launch with Phase A only — AI-extraction
   caching keyed by DOI/source-ID, no public-facing feature yet — and treat
   a browsable catalog or richer tagging as a separate, later decision?
2. **Source ToS re-check:** the scope above (bibliographic metadata + our
   own AI output, never raw abstracts) is designed to avoid needing a
   source-by-source licensing deep-dive, but that's this session's read, not
   a legal one — worth a real look at Crossref's and Europe PMC's terms
   before this ships, same caution as any other data-handling decision.
3. **Cache lifetime:** AI-extracted fields for a published study don't
   normally change — is "cache indefinitely, no expiry" acceptable, or
   should there be a re-extraction policy (e.g. if the AI model/prompt
   changes materially)?
4. Any objection to this needing a new Supabase table now, ahead of
   Supabase actually being provisioned (`OPEN_RISKS.md` #13) — i.e. this can
   be built and unit-tested the same way the report/payment tables were,
   but can't be live-verified until real credentials exist?

Once these are answered, this becomes a normal implementation task, sized
similarly to Phase 7 (persistence) rather than a new phase of its own.

# Status

## Current phase

Phase 4 — Source adapters: **complete** (with a flagged validation gap — see
below). Phase 5 (search, ranking, screening) next.

## Completed

### Phase 0 — Concept and source audit
- Master package integrated into `erwinfries-hue/takemesis` on branch
  `claude/takemesis-mvp-app-f622xx`, `docs/CLAUDE.md` mirrored to repo root.
- All 21 base documents, `.env.example`, `PACKAGE_MANIFEST.json`, and supplied
  visual references reviewed.
- `CONCEPT_REVIEW_NOTES.md`: deep audit across 10 required perspectives.
- All mandatory open decisions from `02_CONCEPT_REVIEW_PROTOCOL.md` resolved via
  one-question-at-a-time dialogue — see `DECISIONS_LOG.md` and
  `FINAL_CONCEPT_DECISIONS.md`.
- `FINAL_MVP_SCOPE.md`, `SOURCE_COVERAGE_MATRIX.md`, `IMPLEMENTATION_PLAN.md`,
  `OPEN_RISKS.md` produced.
- Implementation approved by Erwin on 2026-07-25.

### Phase 1 — Foundation
- Next.js 16 App Router scaffold at repo root, TypeScript strict, Tailwind CSS v4,
  no basePath, no AXIA4 reverse proxy.
- Brand design tokens (navy/teal/gold/warning palette per
  `13_DESIGN_SYSTEM_BRAND_AND_ASSETS.md`) in `src/app/globals.css`, with a WCAG
  AA contrast note distinguishing decorative vs. body-text-safe shades.
- Cookie-based DE/EN i18n scaffold (`src/lib/i18n/`): dictionaries, `getDictionary`,
  `getLocale`, `LocaleSwitcher` — deterministic German default (DACH market) with
  explicit user override, no Accept-Language sniffing.
- Zod-validated environment config (`src/lib/env/`), split into client
  (`NEXT_PUBLIC_*`, statically inlined per var) and server schemas mirroring
  `docs/.env.example`; secrets not yet provisioned stay optional until their
  consuming feature is built.
- Test harness: Vitest (unit + integration projects), Playwright + axe-core for
  e2e/accessibility (`@a11y`-tagged spec). All commands from `CLAUDE.md` wired:
  `dev`, `build`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`,
  `test:a11y`, `verify`.
- GitHub Actions CI (`.github/workflows/ci.yml`): lint/typecheck/unit/integration/
  build job, plus a separate Playwright e2e/a11y job.
- `npm run verify` passes end-to-end; all 12 unit+integration tests and all 3
  Playwright specs (including the accessibility scan) pass.
- Minimal branded placeholder home page (not the final landing page — that's
  Phase 2) proves the design tokens, i18n, and layout shell work together.

### Phase 2 — Topic inspiration and landing
- `src/content/topics.ts`: all 12 categories (decision #1), localized DE/EN, each
  with description, 4–8 example questions, limitations, risk profile, and source
  route (matching `SOURCE_COVERAGE_MATRIX.md`); `elevated` risk profile on
  Gesundheit & Prävention and Kinder/Erziehung (decision #2).
- Shared site chrome (`SiteHeader`, `SiteFooter`) moved into the root layout;
  reusable `TopicCard`, `ExampleQuestionChip`, `OwnQuestionForm` components per
  `13_DESIGN_SYSTEM_BRAND_AND_ASSETS.md`.
- Full landing page with all 10 required sections from
  `05_UX_USER_FLOWS_AND_PAGES.md` (brand/promise, topic grid teaser, own-question
  input, example-report preview, how-it-works, free-vs-paid, source transparency,
  trust/beta, price/no-subscription, footer/legal).
- `/topics`: full category grid with all example questions, own-question form.
- `/example-report`: honest "in preparation" placeholder naming the curated topic
  (decision #3); real content is Phase 8, once source adapters exist.
- `/methodology`, `/sources` (source-routing table sourced from the same topics
  content module), `/privacy`, `/legal` (seller identity from decision #11, interim
  tax wording from decision #12), `/about`.
- Example-question chips deep-link into the own-question form with the question
  prefilled (`?q=...`) — a real, working convenience, not a simulated backend;
  no fake question-processing is implied anywhere in the UI copy.
- Playwright + axe caught and fixed 2 real WCAG AA contrast violations (teal-500/
  neutral-400 as body text) during this phase; both now documented in
  `globals.css` as decorative-only shades. Also caught and fixed a broken
  accessible-label association and a stale-state bug in `OwnQuestionForm` when
  navigating between chips on the same page.
- All 24 unit/integration tests and all 20 Playwright specs (incl. 8 a11y scans)
  pass; `npm run verify` passes end-to-end.

### Phase 3 — Question interpretation
- `src/lib/classification/domain.ts`: rule-based domain classifier — deliberately
  not AI (`ANTHROPIC_API_KEY` isn't provisioned; `AI_EXTRACTION_ENABLED=false`).
  Builds a term index from each topic's own name/description/examples (so it can't
  drift from the taxonomy content) and scores a question against all 12 categories;
  returns up to 3 ranked candidates, or an empty result that triggers a manual
  fallback rather than guessing.
- `src/lib/classification/high-risk.ts`: independent high-risk detector (decision
  #2) — cancer, pregnancy, prescription drugs, vaccines, mental-health crisis,
  acute symptoms, dosing, legal/financial high-stakes (term lists), plus a
  combination rule for pediatric treatment (child term + treatment term
  co-occurring, so ordinary child-development questions aren't over-blocked).
  Deliberately simple substring matching: for a safety gate, a false positive
  (unnecessary restriction) is the acceptable failure mode, a false negative isn't.
- `/search`: real route wiring both classifiers together. No question → prompt
  back to `/topics`. High-risk match → `HighRiskNotice` (safe general orientation,
  pointer to professional help incl. Dargebotene Hand 143, no domain shown, no
  path to payment — matches `restricted_high_risk` semantics from `05`). Otherwise
  → `QuestionClarification`: confirm the top-scored domain or pick one of up to 2
  alternatives (or, if nothing scored, the full 12-topic list), explicitly labeled
  as rule-based (not yet AI) in the UI copy. Confirming states honestly that
  source search/eligibility are a later build step — no fake progress.
- `OwnQuestionForm` now does a real (JS-optional) GET submission to `/search`
  instead of a client-only "coming soon" toast.
- 13 new unit tests (classifiers) + 7 new e2e specs (full submit→classify→confirm
  flow, high-risk restriction, no-match fallback, empty state, 3 a11y scans).
  44 unit/integration tests, 27 Playwright specs total; `npm run verify` passes.

### Phase 4 — Source adapters
- `src/lib/source-adapters/types.ts`: `NormalizedRecord` and `SourceAdapter`
  interfaces per `07`/`10` — every field the docs require (source, identifiers,
  title, authors, venue, year, publication type, abstract, OA status, retraction
  status, subject concepts, source URL, data completeness, provenance
  timestamp). Missing upstream data stays `null`, never guessed.
- `src/lib/source-adapters/http.ts`: shared fetch-with-timeout-and-bounded-retry
  helper (`SourceAdapterError` on exhaustion) so every adapter degrades safely
  when a source is unavailable, per the resilience requirements in `10`.
- `src/lib/source-adapters/publication-type.ts`: conservative keyword heuristic
  for study design (RCT/cohort/meta-analysis/...) — returns `"unknown"` rather
  than guessing when nothing matches, since the search APIs only return a coarse
  document type, not a study design.
- Four adapters, one per `01`'s expected source roles: `openalex.ts` (broad
  discovery, incl. abstract reconstruction from OpenAlex's inverted-index
  format), `crossref.ts` (DOI/metadata verification, incl. JATS-tag stripping
  for abstracts), `europe-pmc.ts` (biomedical), `ncbi.ts` (biomedical,
  chained esearch→esummary; abstracts require a further `efetch` call,
  deliberately deferred — see `OPEN_RISKS.md` #11).
- `registry.ts`: structured topic→adapter routing matching
  `SOURCE_COVERAGE_MATRIX.md` (all 12 topics covered, tested), plus
  `checkAllSourceStatuses()` for the future admin source-health view (Phase 9).
- **Validation gap, flagged not hidden:** this sandbox's network egress policy
  blocks all four API hosts (confirmed 403 policy denial), so adapters were
  built against documented API contracts and tested against hand-authored
  fixtures (`src/lib/source-adapters/fixtures/`), not recorded live responses.
  Tracked as a blocking item in `OPEN_RISKS.md` #2 — must be run against the
  real APIs from an environment with network access before Phase 4 is trusted
  in production.
- 30 new unit tests (http helper, publication-type heuristic, all 4 adapters,
  registry). 63 unit/integration tests total (62 unit + 1 integration);
  `npm run verify` and the full 27-spec Playwright suite (unaffected by this
  phase, re-run to confirm) pass.

## Not started

Phases 5–13 from `IMPLEMENTATION_PLAN.md`: search/ranking/screening, eligibility
engine, Stripe/report lifecycle, premium report renderer, email/admin/analytics,
hardening, preview beta, production prep, production launch.

## Blocking items tracked for later (do not block continued implementation)

- Treuhänder confirmation on Swiss MWST / EU cross-border VAT (`OPEN_RISKS.md` #1)
  — blocks live Stripe mode and real payments only.
- Live-network validation of the 4 source adapters (`OPEN_RISKS.md` #2) — blocks
  trusting Phase 4 in production, not continued Phase 5+ development (ranking/
  screening logic can be built and tested against the same fixtures).

## Next step

Phase 5: query builders per adapter, deduplication (e.g. by DOI), ranking per
`07`'s signals (relevance, study design, completeness, recency — decision #8
caps detailed results at 15), screening decisions with exclusion reasons,
transparent failure states when a source is down — per `IMPLEMENTATION_PLAN.md`.

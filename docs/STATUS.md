# Status

## Current phase

Phase 10 (Hardening) is complete. Phases 11–13 (preview beta, production
prep, production launch) are **blocked on real infrastructure this session
doesn't have** (Vercel project, Stripe/Supabase/Resend accounts, Hostpoint
DNS access, Treuhänder sign-off) — most of their concrete steps are explicit
`CLAUDE.md` human-stop-conditions. Per Erwin's 2026-07-26 instruction
("finish everything as far as possible, ask only where truly necessary"),
everything from those phases that *is* buildable without live access has
been done: an independent code review (`docs/INDEPENDENT_REVIEW.md`), a
step-by-step production runbook (`docs/PRODUCTION_RUNBOOK.md`), and a
smoke-test script + checklist (`docs/SMOKE_TESTS.md`,
`scripts/smoke-test.sh`, live-verified against a real build). What's left in
11–13 needs Erwin (see "Blocking items" below).

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

### Phase 5 — Search, ranking, screening
- `src/lib/source-adapters/types.ts`: added `"protocol"` to `PublicationType`;
  `publication-type.ts` now detects protocol language ("study protocol",
  "protocol for a randomized...") *before* any other design match, since a
  protocol is not an outcome study regardless of what trial type it describes.
- `src/lib/search/dedupe.ts`: merges records representing the same work across
  adapters — normalized DOI first, then normalized title+year, else falls back
  to `(source, sourceId)` so unmatched records never collide. Field-level merge
  prefers richer data (present over null, abstract over metadata-only), and a
  `retracted` flag from any one source always wins over another source's
  `unknown`/`none` — a safety property, not just a data-quality one.
- `src/lib/search/screening.ts`: include/exclude decisions using only reasons we
  can honestly compute from adapter metadata — `retracted`, `protocol_only`,
  `insufficient_detail` (no usable title). The doc's other exclusion reasons
  (wrong topic/population, non-comparable intervention, unsupported language)
  need real content understanding we don't have yet (AI not wired up) and are
  deliberately not faked — tracked in `OPEN_RISKS.md` #12.
- `src/lib/search/relevance.ts` + `ranking.ts`: term-overlap relevance score,
  study-design weighting (meta-analysis > systematic review > RCT > ... >
  protocol at 0), a small recency signal that maxes out at ~10% of the
  relevance weight (so results are never ranked "solely by recency"), and a
  minor penalty for corrected-but-not-retracted records.
- `src/lib/search/run-search.ts`: orchestrates adapters (routed per topic via
  the Phase 4 registry) → dedupe → screen → rank, with each source's failure
  isolated (one adapter being down doesn't block the others) and full
  transparency stats returned (candidate/duplicate/included counts, exclusion
  breakdown by reason, per-source ok/error, search date, screening version).
  The core logic (`runSearchWithAdapters`) takes an explicit adapter list, so
  it's fully unit-tested with fake in-memory adapters — no network or fixture
  mocking needed at this layer.
- 29 new unit tests. 92 unit tests + 1 integration test; `npm run verify` and
  the full 27-spec Playwright suite pass.

### Phase 6 — Eligibility and teaser
- `src/lib/eligibility/eligibility.ts`: implements decision #4's thresholds as
  named constants (`ELIGIBLE_MIN_RESULT_BEARING_STUDIES`, etc.) — `eligible`
  (≥5 result-bearing studies, or 1 review/meta-analysis + ≥2 individual
  studies), `eligible_with_limitations` (2–4 result-bearing, or enough studies
  but mostly metadata-only), `not_eligible` (below both). A report-depth
  estimate (`estimateReportDepth`, out of the 9 mandatory sections) acts as a
  conservative backstop that can force `not_eligible` even if study counts
  alone would suggest otherwise. `restricted_high_risk` is decided earlier
  (Phase 3, before any search runs) and isn't produced here.
- `src/lib/pricing/price-config.ts`: central price config reading
  `REPORT_PRICE_MINOR`/`REPORT_CURRENCY`/`REPORT_PRICE_VERSION` from server
  env (decision #9: CHF 9.90 / `MVP-01`), with an `Intl`-based display
  formatter.
- `src/lib/eligibility/teaser.ts`: turns a `SearchRunResult` + eligibility
  assessment into teaser data — study-type distribution, a small top-3 study
  preview, which sources were unavailable, and a **preliminary, structurally-
  derived** confidence label (study count/design only — explicitly not the
  full AI-assessed model from `08`, and labeled as such in the UI, since no
  AI is wired up yet).
- `/search` now runs the real Phase 4/5 pipeline once a domain is confirmed
  (`QuestionClarification` is now a plain GET form, no client JS needed) and
  renders one of: `SearchFailedNotice` (every source unreachable — verified
  live in this sandbox, see below), `NotEligibleNotice`, or `FreeTeaser` +
  `PaywallPanel` (with a prominent limitations notice for the
  `eligible_with_limitations` tier, and the elevated-risk input warning for
  Gesundheit & Prävention / Kinder & Erziehung). The paywall is transparently
  non-functional yet ("Stripe checkout wird in Phase 7 angebunden") rather
  than a fake buy button.
- **Live-verified in this sandbox:** confirming a domain was manually checked
  against the running dev server — since this environment still can't reach
  the 4 source APIs, it correctly renders `SearchFailedNotice` rather than a
  fabricated result. This is real end-to-end behavior of the resilience path,
  not a mock; the success-path *rendering* is covered by unit tests against
  fake `SearchRunResult`s (network-independent by design, per the Phase 4/5
  testing approach agreed with Erwin).
- 21 new unit tests (eligibility, teaser builder, price config) + 2 new e2e
  specs (confirm→search-failed flow, +1 a11y scan). 112 unit tests + 1
  integration test, 29 Playwright specs; `npm run verify` passes.

### Phase 7 — Persistence and Stripe
Erwin chose (2026-07-25) to build this phase's code/migrations without live
credentials, the same approach as Phase 4's adapters, rather than provisioning
Supabase/Stripe test accounts first or reordering phases.

- `supabase/migrations/20260725220000_init_core_schema.sql`: all 13 core
  tables from `10_TECHNICAL_ARCHITECTURE_AND_DATA_MODEL.md` (reports,
  report_sources, search_runs, screening_decisions, payments,
  stripe_webhook_events, report_jobs, feedback, issue_reports,
  analytics_events, price_versions, admin_audit_log, source_health_checks),
  RLS enabled with no policies (default-deny for anon/authenticated — the app
  only ever uses the server-only service-role key, per `10`'s security
  section and the "no mandatory account" architecture). Seeded with the
  `MVP-01` price version. **Never run against a live project** — no Supabase
  project exists yet.
- `src/lib/reports/token.ts`: SHA-256-hashed report tokens (256-bit random
  token given to the user, only the hash stored — decision context: secure
  hashed report tokens).
- Repository pattern for `reports` and `payments`/`stripe_webhook_events`:
  an interface, an in-memory implementation (what all the business-logic
  tests below run against), and a Supabase implementation (structurally
  correct against the migration above, **not run against a live database**).
- `src/lib/reports/lifecycle.ts`: the full state machine from `09` (draft →
  preview_ready → checkout_started → paid → processing → ready, plus
  failed/refund_pending/refunded/blocked/expired branches) as pure,
  fully-tested transition rules — enforced through a single
  `transitionReportStatus` choke point so neither repository implementation
  can bypass it.
- `src/lib/stripe/checkout.ts`: server-side Checkout Session creation with
  report ID + price version in metadata (`09`), preferring a configured
  `STRIPE_PRICE_ID_MVP_01` and falling back to inline `price_data` from our
  own price config for local dev before that Price exists in the dashboard.
- `src/lib/stripe/webhook.ts` + `webhook-route-handler.ts` +
  `/api/stripe/webhook`: raw-body signature verification
  (`stripe.webhooks.constructEvent`), event-ID idempotency (duplicate
  deliveries are detected and skipped entirely, not just deduplicated at the
  response level), and a second independent safety net (a report already
  past `checkout_started` is never re-fulfilled even under a hypothetically
  different event ID). "No unlock from redirect alone" is structural: the
  success page (`/checkout/success`) cannot mark anything paid — only this
  webhook handler can.
- `/checkout/success` and `/checkout/cancel`: the success page explicitly
  states it is not proof of payment (`09`'s rule verified in the UI copy,
  not just the backend); cancel page offers retry.
- Every Stripe/Supabase client (`getStripeClient`, `getSupabaseClient`) is
  lazily constructed — importing these modules never fails before real
  credentials exist; the clear error only surfaces if something actually
  tries to call Stripe/Supabase without them configured, same pattern as the
  Phase 4 adapters.
- **Not done in this phase, and deliberately so:** the `/search` page's
  `PaywallPanel` still doesn't have a working "buy" button, and no report
  row is created when a teaser is shown. Wiring that up meaningfully requires
  real Supabase/Stripe credentials to create/persist a report and hand back
  a working checkout URL — building that against nothing would produce code
  that's guaranteed to error in this sandbox and unverifiable either way.
  That live-wiring is the natural first step of the next session that has
  real credentials (tracked in `OPEN_RISKS.md`).
- 36 new unit tests (lifecycle, token, in-memory repositories, checkout
  session builder, webhook signature/idempotency, webhook route handler).
  148 unit tests + 1 integration test, 33 Playwright specs (2 new: checkout
  success/cancel pages); `npm run verify` passes.

### Phase 8 — Premium report
- `src/lib/reports/premium-report.ts`: `buildPremiumReportData` — a pure
  function producing all 9 sections from `06_PREMIUM_REPORT_SPECIFICATION.md`
  out of a `SearchRunResult` + eligibility assessment. Real, computable data
  is populated everywhere it exists (citations built from actual authors/
  year/title/venue, search stats, study-type distribution, publication-year
  range, confidence label, full source appendix). Fields that genuinely need
  AI (`01`'s "structured extraction... plain-language synthesis"): key
  findings, interpreted question, per-study outcome/effect estimate/key
  finding/limitations, study-profile population/intervention/result/
  uncertainty/funding, integrated synthesis, practical interpretation — all
  explicitly `null`/`false`, never guessed, per the evidence-integrity rules.
- Display components (`src/components/premium-report/`): `StudyComparisonMatrix`
  (desktop table + mobile cards, per the design doc's explicit requirement),
  `StudyProfileCard`, `EvidenceLandscapeSection`, `SourceAppendix`,
  `PendingAiNotice` (used everywhere a section is honestly not-yet-available),
  `PrintButton`, assembled by `PremiumReportView` with a jump-link section
  nav (hidden on print) and print-friendly layout (`print:` variants).
- `/example-report` now renders `PremiumReportView` for real — but with
  clearly fictional, explicitly-labeled placeholder studies
  (`src/content/example-report-preview.ts`), never real evidence. The
  genuinely curated, real-source version (decision #3) still needs live
  source adapters, which this sandbox can't reach — building the fake-data
  preview now still delivers real value: it exercises and visually/
  a11y-validates the entire report-rendering pipeline today, live, in a real
  browser, without waiting on that.
- Fixed a real heading-hierarchy bug the new page surfaced: `PremiumReportView`
  originally rendered its own `<h1>`, which collided with the host page's
  `<h1>` (two `<h1>`s on `/example-report`) — changed to `<h2>` since this
  component is always embedded content, not a page root.
- 7 new unit tests (data builder, incl. an explicit "never fabricates
  AI-dependent content" test) + 1 new e2e spec (all 9 sections render, the
  placeholder-data warning is visible, AI-pending sections say so). 155 unit
  tests + 1 integration test, 34 Playwright specs; `npm run verify` passes.

### Phase 9 — Email, admin, analytics
- `src/lib/email/`: report-ready, report-failed, refund-confirmation templates
  as pure, localized (DE/EN) functions — deliberately take no question/report-
  content parameter at all, so raw question text structurally cannot leak into
  an email (docs/11: "no unnecessary sensitive question details"). Lazy Resend
  client + injectable-client `sendEmail` (same DI pattern as Stripe/Supabase).
- `src/lib/analytics/`: the full funnel event list from `11` as a typed
  allowlist; `sanitizeMetadata` strips any non-allowlisted key before an event
  ever reaches a repository or PostHog — a caller cannot leak raw question
  text even by mistake, verified by a dedicated test. `analytics_events`
  Supabase table is the source-of-truth repository; PostHog (EU Cloud,
  decision #14) forwarding is a safe no-op whenever analytics is disabled or
  unconfigured (`NEXT_PUBLIC_ANALYTICS_ENABLED`/`_SITE_ID`).
- `src/lib/admin/auth.ts`: minimal email-allowlist + shared-secret admin auth
  (`OPEN_RISKS.md` #8) — no session storage needed, the cookie is self-
  verifying (HMAC-signed email, keyed on `ADMIN_AUTH_SECRET`), so a forged or
  tampered cookie fails verification without a database lookup.
  `/admin/login`, session cookie, `requireAdminSession` gate, logout.
- `/admin` (report status counts + full report list with status-appropriate
  actions: retry, block, mark refund pending, record refunded, revoke link)
  and `/admin/payments`, both degrading gracefully with a visible "database
  not connected" notice rather than crashing when Supabase isn't configured
  (same pattern as the source adapters). Every action is written to
  `admin_audit_log` via a new `AuditLogRepository`.
- Extended `ReportRepository`/`PaymentRepository` with `listAll()` (fine at
  beta scale — decision #15's 15-person closed beta — paginate before public
  MVP) and the lifecycle state machine with `failed → processing` (the
  "retry report" admin action), with a new test covering it.
- **Live-verified in this sandbox, not just unit-tested:** the full admin auth
  flow (unauthenticated redirect, wrong-credential rejection, correct login,
  logout, graceful no-database state) was run against a real browser via
  Playwright with a test-only fixed `ADMIN_EMAILS`/`ADMIN_AUTH_SECRET` in
  `playwright.config.ts`'s webServer env — genuine end-to-end coverage of the
  one piece of Phase 9 that doesn't need external credentials to fully exercise.
- **Deliberately deferred, not built shallow:** feedback/issue-report
  repositories and admin pages, source-health persistence (`checkAllSourceStatuses`
  from Phase 4 still isn't written anywhere), cost-estimate and topic/source-
  coverage analytics dashboards. `11` lists these as admin sections but they
  need either more Phase-4/8 groundwork (source health) or are genuinely
  low-value to build before there's any real traffic to show — tracked in
  `OPEN_RISKS.md` #15 rather than shipped as empty shells.
- 31 new unit tests (email templates/send, analytics sanitization/tracking/
  PostHog forwarding, admin auth, admin report actions, 1 new lifecycle
  transition) + 6 new e2e specs (full admin login/logout/degradation flow, 2
  a11y scans). 186 unit tests + 1 integration test, 40 Playwright specs;
  `npm run verify` passes.

### Phase 10 — Hardening
- **Security headers + CSP:** `middleware.ts` sets a per-request-nonce CSP
  (`script-src 'self' 'nonce-…' 'strict-dynamic'`, per Next.js's documented
  pattern) plus `next.config.ts` static headers (`X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, a locked-down
  `Permissions-Policy`, HSTS). **Live-verified:** a new `e2e/security-headers.spec.ts`
  confirms the headers are present on a real response and that the nonce
  doesn't break hydration/interactivity (locale switch, navigation) — zero
  browser console errors during real use, not just a static check.
- **Free-search rate limit (decision #7):** `src/lib/security/` — HMAC-hashes
  the client IP (`RATE_LIMIT_SECRET`, raw IPs never stored, matching the
  `CLAUDE.md` privacy rule) into a daily UTC window key; `InMemoryRateLimiter`
  (single-process, functional today) and `SupabaseRateLimiter`
  (serverless-correct, same live-unverified status as the rest of the
  Supabase integration — see `OPEN_RISKS.md` #6) behind one `RateLimiter`
  interface; fail-open (allows the search) whenever `RATE_LIMIT_SECRET` is
  unset, so it's inert until deliberately turned on. Checked in `/search`
  right before `runSearch()` — after the free local classification steps,
  before the costly step.
- **Question length limit:** `MAX_QUESTION_LENGTH = 500` shared between the
  server-side `/search` check and the `OwnQuestionForm` textarea's `maxLength`
  (client-side UX only; the server check is the actual enforcement).
- **Report retention/expiry (decision #5):** `src/lib/reports/retention.ts`
  (pure `computeReportExpiry`/`isPastExpiry`) + `expire-reports.ts`
  (`expireDueReports`, scans `ready` reports past `expiresAt` and transitions
  them to `expired` through the existing lifecycle choke point — a new
  `ready → expired` transition was added to `lifecycle.ts` for this).
  `expiresAt` is set to `paidAt + REPORT_RETENTION_MONTHS` (default 12) at
  Stripe-webhook fulfillment time. Exposed as `GET /api/cron/expire-reports`,
  gated on `Authorization: Bearer <CRON_SECRET>` (unset means the route
  always 401s — **live-verified** against the running dev server in this
  sandbox), scheduled daily at 03:00 UTC via a new `vercel.json`. Not yet
  triggered by a real Vercel Cron invocation (no deployed project) — tracked
  in `OPEN_RISKS.md` #16, along with the still-missing secure-link report
  viewer that would actually read `expired` status back to a user.
- New e2e coverage for both new `/search` guard states (question-too-long,
  rate-limited), each with its own `@a11y` scan; the rate-limited spec uses a
  unique `x-forwarded-for` per run so it never collides with the other
  `/search` specs' shared "unknown" bucket.
- 29 new unit tests (rate limiter, rate-limit key hashing, free-search-limit
  check enabled/disabled, env schema default, retention date math,
  expire-reports job, cron route handler authorized/unauthorized/unconfigured)
  + 5 new e2e specs (2 functional, 3 a11y). 215 unit tests + 1 integration
  test, 46 Playwright specs; `npm run verify` passes.
- **Not done in this phase:** dependency audit re-check (`npm audit` findings
  from Phase 1), a deeper manual accessibility pass beyond the automated axe
  scans, performance testing, and evidence-safety/hallucination tests — these
  need either real traffic/content or are lower-value before Phase 11's live
  credentials exist; not tracked as a numbered risk since none are blocking
  and none were silently skipped without being named here.

### Phases 11–13 — Preview beta / production prep / production launch (docs only)
Everything in these phases that needs a live Vercel/Stripe/Supabase project,
Hostpoint DNS access, or Treuhänder sign-off is genuinely blocked — not
skipped, but not attemptable from this session (several of these are
explicit `CLAUDE.md` human-stop-conditions: DNS ownership, Stripe
configuration, legal/tax approval). What was buildable without them:
- `docs/INDEPENDENT_REVIEW.md`: ran the full 25-item review from
  `18_FINAL_INDEPENDENT_REVIEW_PROMPT.md` against the actual codebase (not
  prior status claims) — re-verified every command (lint/typecheck/test/
  build/e2e all pass; `npm audit` genuinely could not run, registry endpoint
  retired), spot-checked claims that hadn't been independently confirmed
  before (no Google Scholar/paywall-bypass code exists anywhere; source
  routing per topic is a real table, not just UI copy; no iframe/AXIA4
  embedding anywhere). Verdict: **NO-GO**, correctly — no P0 code defect
  found, but real infrastructure/credentials are missing, which the review
  documents item by item rather than papering over.
- `docs/PRODUCTION_RUNBOOK.md`: turns `00_START_HERE_ERWIN.md` §7–12 into an
  executable checklist using this repo's actual env var names, including a
  rollback plan (Vercel instant rollback, admin-driven data correction
  instead of raw DB edits, additive-only migrations, easy `CRON_SECRET`
  rotation) that didn't exist anywhere before.
- `docs/SMOKE_TESTS.md` + `scripts/smoke-test.sh`: a read-only,
  non-destructive HTTP smoke-test script (never starts a checkout, never
  logs into admin) — **live-verified in this session**, all 17 checks pass
  against a real `npm run build && npm run start`. Manual checks that need a
  human or real payment (Stripe checkout, refund, email delivery, mobile,
  DNS/mail) are listed separately, not scripted, since scripting those would
  either be unsafe (real money) or not meaningfully automatable.
- No git tag was created — `PRODUCTION_RUNBOOK.md` explicitly says
  `v0.1.0` should only be tagged after a GO-verdict independent review
  against production, not preemptively.

Also still pending within already-"complete" phases: AI-based query
interpretation/extraction/synthesis (Phase 3 + Phase 8, needs
`ANTHROPIC_API_KEY`), live wiring of Phases 4/5/7/9/10 (needs Supabase/Stripe/
Resend/PostHog/Vercel Cron credentials and network access), the deferred
Phase 9 admin sections, and the secure-link report viewer noted in Phase 10
above — all tracked in `OPEN_RISKS.md`.

### Marketing differentiation pass (post-Phase-13, Erwin's request)
Erwin asked for a marketer's assessment of what to optimize for market
potential without adding complexity, then to implement all of it. Eight
opportunities were identified and all eight were implemented as copy/config/
small-repository-method changes — no new architecture, no new external
dependency:
- **"Why not just ask ChatGPT?" section** (`src/app/page.tsx`, new
  `home.whyNotChatGpt*` dictionary keys): the single biggest unaddressed
  objection a visitor has — real curated sources, the eligibility gate (we
  don't sell what we can't support), and the structural no-fabrication
  guarantee, positioned right after the price section, linking to
  `/methodology`.
- **Example-Report CTA on the paywall itself** (`PaywallPanel`): a link to
  `/example-report` right where someone is deciding whether to pay — the
  strongest existing trust signal wasn't visible at the moment it matters most.
- **Open Graph / Twitter metadata** (`layout.tsx`): `title`/`description`
  now render properly when a link is shared (WhatsApp is the common DACH
  sharing channel). No `og:image` — no branded 1200×630 asset exists in this
  repo, and inventing one isn't this session's call; noted as a follow-up
  in `OPEN_RISKS.md`.
- **Honest refund note near price** (`home.refundNote`,
  `paywallPanel.refundNote`): deliberately **not** worded as a "money-back
  guarantee" — `docs/09_MONETIZATION_STRIPE_AND_REPORT_LIFECYCLE.md` only
  documents automatic refund for technical generation failure plus manual
  refunds for other cases, not an unconditional satisfaction guarantee.
  Marketing a broader promise than the actual policy would misrepresent it.
- **Social-proof counter per topic** (`/topics`, "N questions already asked
  in this domain"), gated behind `SOCIAL_PROOF_MIN_COUNT = 5`
  (`src/lib/analytics/social-proof.ts`) so it never shows a misleading "0" or
  "1" before real beta traffic exists — it will start appearing on its own
  once a domain crosses the threshold. Building this surfaced a real,
  previously undocumented gap: **`track()` (Phase 9's analytics module) was
  never called from any route** — the whole event-recording pipeline existed
  but was fully disconnected. Fixed as part of this pass:
  - `track()` now catches repository failures instead of throwing (matches
    `forwardToPostHog`'s existing "analytics is optional, must never break
    the page" principle) — necessary because this session has no Supabase
    configured, so without this fix, wiring `domain_classified` into
    `/search` would have 500'd the page on every domain confirmation.
  - `domain_classified` is now tracked in `/search` when a domain is
    confirmed (awaited, not fire-and-forget, since an un-awaited promise can
    be cut off on a serverless platform once the response is sent).
  - `AnalyticsEventRepository.countByEventAndDomain()` added to both
    implementations — Supabase via PostgREST's `metadata->>domainSlug`
    jsonb-path filter (no grouping query/DB function needed), in-memory via
    a plain filter.
  - Every other funnel event from Phase 9's allowlist (question_submitted,
    paywall_viewed, checkout_completed, etc.) is still not called anywhere —
    only `domain_classified` was wired, scoped to what this feature needed.
    Wiring the rest is real, separate work, tracked in `OPEN_RISKS.md`.
- **Price anchor** (`home.priceAnchor`): "a wrong decision usually costs
  more than CHF 9.90" — reframes the price against the cost of *not* having
  the answer, not against subscription fatigue.
- **Beta positioning** (`home.betaPositioning`): "join the first 15" stated
  as a feature (early influence), not hidden — matches decision #15's actual
  15-person closed beta rather than inventing exclusivity.
- **Hero example question** (`home.heroExampleQuestion`): a single concrete,
  high-intent example ("Does creatine actually work — or is it a waste of
  money?") right under the headline, before the "12 broad topics" framing —
  leads with a decision people already spend money on, per the analysis that
  "curious platform for anyone" is a weak acquisition hook compared to a
  concrete stakes-bearing question.
- 5 new unit tests (`track` resilience,
  `InMemoryAnalyticsRepository.countByEventAndDomain`,
  `getAskedCountForDomain` threshold gating × 2 + failure resilience). 220
  unit tests + 1 integration test, 46 Playwright specs (unchanged — no new
  e2e state was introduced, existing specs re-verified passing); `npm run
  verify` passes. Landing page and `/topics` visually confirmed live
  (screenshots) in this session's dev server, including confirming the
  social-proof badge correctly does not render pre-launch.

### Market-acceptance review + WOW-effect pass (post-marketing-pass, Erwin's request)
Erwin asked for a critical, honest market-acceptance review (product/offer/
presentation/other) and separately for ideas that could create a genuine
"wow" moment, then asked to implement everything scoped as small/medium
effort. Full findings live in the chat record, not duplicated here; the
single most important one: **the paid product's core value (AI synthesis,
key findings, practical interpretation) doesn't exist yet** — no
`ANTHROPIC_API_KEY` — so the biggest lever for both acceptance and "wow" is
that, not UI polish. What was implemented from the small/medium-effort list
(all honest — no fabricated data, no dark patterns, three ideas deliberately
descoped from their original pitch for exactly those reasons):
- **Visual confidence gauge** (`src/components/confidence-gauge.tsx`): a
  4-segment bar alongside the existing text label (never replacing it —
  color/shape alone must never carry the information) in both the free
  teaser and the premium report.
- **TEKMESIS vs. generic-AI-chatbot comparison table**: replaced the "why
  not ChatGPT" section's three prose cards with a structured 5-row
  comparison table. Deliberately compares against "a generic AI chatbot,"
  not a named competitor by behavior claims — factual, verifiable claims
  about TEKMESIS's own properties; generic, defensible characterizations on
  the other side, avoiding unverifiable comparative-advertising claims
  about a specific product.
- **Honest branded loading state** (`src/app/search/loading.tsx`, Next.js's
  automatic route-segment loading convention): **descoped from "live
  per-source ticks"** — that would need a streaming architecture change and,
  more importantly, would mean claiming a specific source is "done"
  searching when we don't actually track per-source completion. What's
  built instead is a real branded wait state ("we're searching scholarly
  databases") show while the actual search runs — live-verified against the
  real resilience path in this sandbox (screenshotted mid-search).
- **Editorial print/PDF stylesheet**: **descoped from "a real PDF
  generation service"** (Puppeteer et al. would be new server
  infrastructure, not a stylesheet change) to CSS-only improvements to the
  existing `window.print()` path: a print-only cover page
  (`print-cover-page.tsx`, hidden on screen), page-break control around
  study profiles/sources, `print-color-adjust: exact` so accent colors
  survive printing, a light-mode-forced `@media print` override (the
  existing `prefers-color-scheme: dark` rule would otherwise print a
  dark-navy page background), and hiding the on-screen site header/footer
  chrome in print so the report reads as a standalone document.
- **Mini live-demo on the landing page** (`live-demo-preview.tsx`): a
  compact, clearly-labeled ("Beispielhafte Darstellung") teaser preview
  built by running the real `buildTeaserData` logic against the same vetted
  fictional dataset `/example-report` already uses — not hand-invented
  numbers. Replaced (not duplicated with) the plain-text hero example line
  it superseded.
- **"Most-asked topics this week"** (`src/lib/analytics/trending-topics.ts`,
  `/topics`): **descoped from "most-asked *questions*" to most-asked
  *topics*** — raw question text may never enter analytics (`CLAUDE.md`).
  New `countByEventAndDomainSince()` on both repository implementations
  (Supabase: `created_at` filter via PostgREST; in-memory: restructured to
  track a `recordedAt` timestamp per event, which the public `events`
  shape needed for existing tests didn't previously carry). Gated behind
  `TRENDING_MIN_COUNT` (3) and capped at `TRENDING_TOP_N` (3), same
  "don't show a misleading near-zero" principle as the social-proof badge.
  Verified against real (temporarily hardcoded, then reverted) data via
  screenshot since this sandbox has no live Supabase traffic to produce it
  organically.
- **Real regression caught and fixed by the a11y suite, not shipped**: the
  live-demo card's initial CSS entrance animation faded in `opacity`
  alongside `transform`; axe correctly caught reduced text contrast
  mid-transition (2.12:1 against a required 4.5:1). Fixed by animating only
  `transform`, never `opacity` — text now stays at full contrast throughout
  the animation. This is the kind of thing "npm run verify passes" alone
  wouldn't have caught without the full Playwright `@a11y` run.
- 5 new unit tests (`trending-topics` ranking/threshold/cap/failure-resilience).
  224 unit tests + 1 integration test, 46 Playwright specs (unchanged —
  existing specs re-verified passing after the contrast fix, run repeated
  5× to rule out flakiness); `npm run verify` passes. Landing, `/topics`,
  `/search`'s loading state, and the print/PDF cover page all visually
  confirmed live in this session's dev server via screenshots.

### Live-network validation pass (post-WOW-effect, Erwin's request)
Erwin asked to actually test the app rather than just read about it. Since
this sandbox's egress policy blocks all 4 source APIs, a real Vercel project
was set up (`erwinfries-hue/TAKEMESIS`, Production Branch set to
`claude/takemesis-mvp-app-f622xx`, confirmed auto-redeploy on push) — the
first environment in this project's history with genuine internet access to
OpenAlex/Crossref/Europe PMC/NCBI. This is exactly the live-network
validation `OPEN_RISKS.md` #2 had been waiting for, and it immediately
surfaced a real bug:

- **Bug found live:** two real test questions ("ist das Elektrofahrzeug
  nachhaltiger als ein vergleichbares Dieselfahrzeug?" and "Hilft Kreatin
  beim Muskelaufbau?") both returned search results with several visibly
  irrelevant studies (linguistics, cultural philosophy, TV media, project
  management, customer service) mixed in among the relevant ones. **Root
  cause, found by tracing the actual code, not guessed:** `crossref.ts`
  sends the raw natural-language question verbatim as Crossref's loose
  full-text `query=` parameter, and while `relevance.ts` already computed a
  term-overlap relevance score per record, `screening.ts` only ever used it
  for *sort order* (via `ranking.ts`) — it was never used to *exclude*
  anything. Irrelevant matches with a generic connector-word overlap
  ("hilft", "beim") still made it into the results list, just ranked lower.
- **Fix:** `relevance.ts` now strips a German+English stopword list (closed-
  class function/connector words) before computing term overlap, so generic
  verbs can no longer inflate a score on their own. `screening.ts` gained a
  new `MIN_RELEVANCE_SCORE = 0.4` exclusion threshold and `"not_relevant"`
  `ExclusionReason`, threaded through `run-search.ts` via a new `query`
  parameter on `screenRecords()`. The threshold was verified numerically
  against both real production examples: a generic-connector-only match
  scored 1/3 ≈ 0.33 (now excluded), a genuinely relevant record scored
  2/3 ≈ 0.67 (still included). `SCREENING_VERSION` bumped to
  `"screening-v2"`.
- **Second request in the same turn:** Erwin asked whether a live, typing-
  time hint suggesting the likely topic domain would be worthwhile. Built as
  `OwnQuestionForm`'s new debounced (400ms) preview: it reuses
  `topDomainCandidates` — the exact same rule-based classifier and
  `score > 0` decision boundary `/search`'s real post-submit clarification
  screen already uses — so the live hint can never promise a match that
  submitting wouldn't also find. Deliberately not a second, independently-
  tuned heuristic. Shown as `role="status"` text ("Könnte passen zu: …"),
  disappears when the field is cleared or nothing scores above zero.
- Still open, not yet resolved: one of the two live test runs showed an
  "OpenAlex nicht erreichbar" notice; Erwin was asked to check Vercel's
  Runtime Logs for the specific OpenAlex error text (genuine outage vs. a
  fixable timeout/serverless-duration-limit issue) but hasn't yet — tracked
  in `OPEN_RISKS.md` #2.
- 3 new unit tests (`relevance.ts` stopword behavior), 3 new unit tests +
  full rewrite of existing cases (`screening.ts`'s new query parameter and
  `not_relevant` exclusion), plus adjustments to 4 other test files whose
  `excludedByReason` fixtures needed the new field. 2 new e2e specs (the
  live suggestion appearing and disappearing). 230 unit tests + 1
  integration test, 48 Playwright specs; `npm run verify` and the full e2e
  suite pass. Visually confirmed live via screenshot: the suggestion
  correctly reads "Könnte passen zu: Ernährung & Supplements" while typing
  the creatine question.
- **Round 2, same day:** Erwin re-ran the creatine question on the live
  Vercel deployment after the fix above. Better (13 of 15 obviously-
  irrelevant records now correctly excluded), but the 2 remaining "included"
  studies were still off-topic — one about weight regain after muscle
  building, one about a cancer-cachexia messenger substance — neither
  mentions creatine at all. **Root cause, found by re-deriving the actual
  tokenization, not assumed:** the question "Hilft Kreatin beim
  Muskelaufbau?" reduces to just 2 meaningful terms after stopword
  filtering ("kreatin", "muskelaufbau"). Both offending records matched only
  "Muskelaufbau" — 1 of 2 terms = 0.5, which still clears the 0.4 fraction
  threshold. Removing stopwords doesn't fix this: it shrinks the numerator
  and denominator together, so the fraction can stay just as high even
  though the record misses the question's actual named subject. **Fix:**
  `relevance.ts` gained `meetsRelevanceThreshold()` — for questions with 3+
  meaningful terms it's the same 0.4 fraction rule as before, but for
  questions with only 1-2 meaningful terms it now requires *every* term to
  match, since a partial match at that granularity isn't a meaningful
  signal. `screening.ts` now calls this instead of comparing
  `computeRelevanceScore` to the threshold directly (that raw fraction
  function is unchanged and still used for ranking/sort order in
  `ranking.ts`, which is a weaker, order-only signal where the old behavior
  is fine). Also fixed a real gap the first pass introduced but didn't
  close: `relevance.ts`'s own comment named "hilft"/"wirkt"/"verbessert" as
  generic connector verbs that needed filtering, but none of them were
  actually in the `STOPWORDS` set — added a full German+English
  conjugated-verb set for the connector verbs actually used across
  `topics.ts`'s example questions and real user questions.
  Verified against all three real records from Erwin's two live test rounds
  (numerically, in new unit tests) plus a new test confirming a record that
  genuinely mentions both terms is still included, and a 3-term-question
  test confirming the plain fraction rule still applies once there's enough
  signal. 2 new/updated screening tests, `MIN_RELEVANCE_SCORE` moved to
  `relevance.ts` (re-exported from `screening.ts` for existing importers).
  232 unit tests + 1 integration test; `npm run verify` passes.

### Admin tool: live-verify example questions (post-round-2 fix, Erwin's request)
Erwin tested a third live question ("Welche Massnahmen senken das Risiko
häufiger Rückenschmerzen?", Gesundheit & Prävention) and got a correct but
disappointing "not eligible" result, then pointed out something the prior
fixes hadn't addressed: the example questions shown on `/topics` were never
actually checked against real evidence coverage — they were written for
topical illustration during Phase 2, when this project had no live network
access at all. `CLAUDE.md`'s Broad-domain rule requires every question to be
"tested for researchability" and "tested for evidence sufficiency," and
"unsupported questions must not be sold" — so an example question that
reliably comes back not-eligible is a real content gap, not just a rough
edge.
- `src/lib/admin/example-question-check.ts`: `checkExampleQuestionsForTopicWithAdapters`
  runs every example question of one topic through the real
  `runSearchWithAdapters` + `assessEligibility` pipeline (no shortcuts —
  the actual screening/ranking/eligibility code, not a simulation), same
  testable-with-fake-adapters split as `runSearch`/`runSearchWithAdapters`
  from Phase 5. `checkExampleQuestionsForTopic` wraps it with the real
  routed adapters. Sequential per question (not parallel) to respect
  NCBI's unauthenticated rate limit and to keep one invocation bounded.
- `/admin/example-questions`: new admin-gated page (`requireAdminSession`,
  same as the rest of `/admin`) — pick a topic + locale, see every example
  question's live eligibility, included/result-bearing counts, and any
  per-source errors, in a table. `maxDuration = 60` declared on the route
  segment since a topic's worth of sequential live API calls can exceed a
  default 10s serverless budget (actual ceiling depends on Erwin's Vercel
  plan — that's a plan constraint, not a code defect, if it still times
  out). Linked from the main `/admin` overview.
- **Live-verified in this sandbox in the one way that's actually possible
  here:** logged into a real running build via Playwright, ran the
  Gesundheit & Prävention topic — since this sandbox still has no network
  to the 4 source APIs, every question correctly showed "Eignet sich
  nicht" with real per-source connection-failure errors listed (not a
  crash, not a fake success) — confirming the auth gate, form, live
  pipeline call, and error surfacing all work end-to-end. The actually
  useful output (which example questions hold up against real evidence)
  can only come from Erwin running this on the live Vercel deployment.
- **Deliberately not done in this pass:** curating `topics.ts`'s example
  question lists themselves. Per the evidence-integrity rule, replacement
  questions can't be invented without checking them too — the correct next
  step is for Erwin to run this tool per topic on `takemesis.vercel.app`
  and report which questions come back `not_eligible`, so any edits to
  `topics.ts` are themselves evidence-checked, not guessed.
- 5 new unit tests (`example-question-check.test.ts`, fake-adapter based:
  per-question result mapping, not-eligible-on-empty, eligible-on-genuine-
  match, per-source error surfacing, unknown-topic-slug safety). 237 unit
  tests + 1 integration test; `npm run verify` passes.

### Visual design pass (Erwin's request)
Erwin asked for a more polished visual identity: a TEKMESIS logo with the
existing tagline, icons/graphics, and a punchier "Über TEKMESIS" text, plus
the `axia4.lovable.app` link needing a `/de/` path segment. No image-
generation tool is available this session, so everything was built as
inline SVG (no new dependency, adapts to light/dark via `currentColor`,
fully accessible) rather than raster images:

- `src/components/brand/tekmesis-logo.tsx`: a shield-and-"T" mark in the
  style of the supplied onepager reference (`docs/assets/onepager/`) — a
  placeholder-quality vector mark, not a finalized trademark asset — plus
  the existing `brand.claim` tagline ("FROM STUDIES TO CLARITY."). Used
  compact (icon+wordmark) in `SiteHeader` site-wide, and stacked
  (icon+wordmark+tagline) on `/about`.
- `src/components/brand/axia4-logo.tsx`: the actual official AXIA4 logo
  (`docs/assets/brand/AXIA4_OFFICIAL_LOGO_REFERENCE.png`, copied verbatim
  into `public/brand/axia4-logo.jpg` — geometry/wording/colors unchanged)
  is now genuinely rendered on the site — previously only text ("AXIA4
  Digital") appeared anywhere, despite the design system doc requiring an
  "AXIA4 parent-brand lockup" component. The source file is a baseline
  JPEG with a white background baked in (no alpha channel); wrapped in a
  small white badge so it stays legible against this app's real dark-mode
  background instead of showing a stray white box. Used in `SiteFooter`
  and `/about`. A transparent PNG/SVG requested directly from AXIA4 would
  let the badge wrapper go away later (tracked in `OPEN_RISKS.md`).
- `src/components/icons/topic-icons.tsx`: one simple line icon per topic
  slug (heart, apple, moon, dumbbell, book, briefcase, ...), shown on
  `TopicCard` and the `/topics` category list. Purely decorative
  (`aria-hidden`) — the accessible name stays the topic's text name.
- `src/components/icons/process-step-icons.tsx`: one icon per "how it
  works" step (pencil, target, magnifying glass, checkmark-shield, eye,
  card, document) — matches the onepager reference's 7-step icon row.
- `aboutPage.body` (DE/EN) tightened per Erwin's approval of the
  short/punchy option: "TEKMESIS macht aus einer Frage einen Evidence
  Report — echte Studien gefunden, verglichen und verständlich erklärt.
  Mit sichtbaren Quellen, offenen Limitationen und ganz ohne falsche
  Gewissheit." (and its English equivalent).
- The `axia4.lovable.app/digital` link needing a `/de/` segment is a
  Vercel environment variable (`NEXT_PUBLIC_AXIA4_DIGITAL_URL`), not
  anything in this repo (the codebase's own default is `https://axia4.ch/digital`,
  the real domain per `CLAUDE.md`) — flagged to Erwin as a one-exact-action
  Vercel dashboard change, not something this session can do.
- **Real pre-existing e2e flake found and fixed while re-running the full
  suite for this pass** (confirmed pre-existing via `git stash` bisection
  against the prior commit, not caused by this design work):
  `e2e/admin.spec.ts`'s authenticated-admin-overview a11y scan raced
  against the Next.js App Router's client-side `<title>` update after the
  login redirect — waiting for the heading to be visible wasn't enough
  (the body can render before `<head>`'s title commits), so axe sometimes
  sampled the DOM with a momentarily-empty `<title>` and flagged a false
  "document-title" violation. Fixed by explicitly asserting
  `toHaveTitle(...)` before scanning.
- 48 Playwright specs (all a11y scans included, unaffected in count —
  no new e2e state introduced) + full unit/integration suite pass;
  `npm run verify` passes. Visually confirmed live via screenshot: header
  logo, topic icons on `/topics`, and the stacked logo + AXIA4 badge on
  `/about`.

**Correction, same day:** Erwin reviewed the live result and asked for two
changes: (1) `/about`'s logo should always use the same icon-left-of-
wordmark layout as the header, not the stacked/centered variant — so
`TekmesisLogo` was simplified to a single fixed layout (the "stacked"
variant and `tagline` prop were removed as dead code once nothing used
them); the tagline itself still shows on `/about`, just as its own line
under the logo rather than baked into a stacked component variant. (2) The
AXIA4 image logo should not be embedded at all — footer and `/about` now
show plain text "AXIA4 GROUP" (the legal-entity name from `/legal`) linking
to `https://axia4.ch`, and `src/components/brand/axia4-logo.tsx` plus the
copied `public/brand/axia4-logo.jpg` asset were deleted as unused. Note:
this runs counter to `CLAUDE.md`'s Design section ("use official AXIA4 logo
asset") — flagged to Erwin as a direct instruction overriding that standing
rule, with a question about whether `CLAUDE.md` itself should be updated to
match. 48 Playwright specs + full unit suite re-verified passing;
`npm run verify` passes. Visually reconfirmed via screenshot.

**Second correction, same day:** Erwin asked to remove the `/about` page's
logo block entirely (not the header's — that stays) so the page now opens
directly with the "FROM STUDIES TO CLARITY." tagline, then the "Über
TEKMESIS" heading; and to remove the redundant "AXIA4 Digital" `<h2>` that
sat directly under the new "AXIA4 GROUP" link (kept the body text and the
"AXIA4 Digital entdecken" CTA below it). The now-unused
`aboutPage.axia4Heading` dictionary key was removed from both locales.
48 Playwright specs + full unit suite re-verified passing; `npm run verify`
passes. Visually reconfirmed via screenshot.

### /topics cleanup + premium report visual/CD upgrade (Erwin's request)
Erwin asked for two more things after seeing the live site: a cleaner
`/topics` page (12 fully-expanded topic cards made for a very long, dense,
monotone page), and a visual/content upgrade for the premium report, which
still looked like "a functional form" rather than a premium branded
deliverable — no logo anywhere in the report itself, no use of the
palette's restrained gold accent, the same "Noch nicht verfügbar" paragraph
repeated verbatim 4 times, and every study design shown as identical plain
text with no visual signal of evidence strength.

- **`/topics`:** "Grenzen dieses Bereichs" and "Quellenrouting" per topic
  are now behind a native `<details>`/`<summary>` ("Details anzeigen") —
  no JS needed, fully accessible, collapsed by default — with the
  name/icon/description/example-question chips always visible. The topic
  list is now a 2-column grid on large screens (`lg:grid-cols-2`) instead
  of a single long column, roughly halving the page's felt length without
  losing any content. New `topicsPage.detailsToggle` dictionary key
  (DE/EN).
- **Premium report — visual:**
  - `TekmesisLogo` now appears both in the on-screen report (a small
    branded strip above the section nav) and on the print cover page
    (previously text-only "TEKMESIS — FROM STUDIES TO CLARITY.", now the
    actual shield mark + separate tagline line, matching `/about`'s
    pattern).
  - A restrained-gold "Premium Evidence Report" badge sits next to the
    logo on-screen — the first actual use of the palette's gold accent
    anywhere on the site. First attempt (pale-gold background + gold text)
    failed a real WCAG AA contrast check in the `@a11y` Playwright run
    (3.34:1, needs 4.5:1) — fixed with a solid gold background and navy
    text, caught and corrected before commit, not shipped broken.
  - Each of the 9 report sections is now a distinct card (white, rounded,
    bordered, subtle shadow on screen; collapses back to plain flowing
    content when printed via `print:` overrides) instead of floating
    directly on the page background — the single biggest contributor to
    the "premium" feel per Erwin's framing.
  - New `src/components/premium-report/study-design-badge.tsx`: colors
    each study's design by the same evidence-hierarchy weight `ranking.ts`
    already computes (meta-analysis/systematic review = solid teal,
    RCT/cohort/quasi-experimental = light teal, weaker designs = neutral,
    protocol = warning-tinted) — always alongside the existing text label,
    never color alone (WCAG). Used in both `StudyComparisonMatrix` and
    `StudyProfileCard`.
  - The confidence gauge in the cover section's stats grid now sits in its
    own teal-tinted highlight cell instead of blending in as a fourth
    equal-weight stat, since it's arguably the single most important
    number in the report.
- **Premium report — content:** `PendingAiNotice` gained a `variant="short"`
  — the first "not yet available" notice (key findings, top of the report)
  still explains the reason in full; the other three occurrences
  (synthesis, confidence, interpretation) now show one short line instead
  of repeating the identical paragraph, cutting real redundancy without
  hiding anything. New `premiumReportPage.pendingAiShort` dictionary key
  (DE/EN). The actual content upgrade (real key findings/synthesis) is
  still gated on `ANTHROPIC_API_KEY` (`OPEN_RISKS.md` #18) — explicitly
  not claimed as solved here, only the presentation of what's honestly
  available today.
- 48 Playwright specs (all a11y scans re-verified, including the contrast
  fix above) + full unit suite pass; `npm run verify` passes. Visually
  confirmed live via screenshot: `/topics`' 2-column collapsed layout, and
  the report's logo strip, gold badge, card sections, and color-coded
  design badges.

### First real AI wiring — extraction + synthesis (Erwin's request, Option A)
Erwin asked to actually build the AI extraction/synthesis integration
(`OPEN_RISKS.md` #18), chose "Option A" over building the full persisted-
report flow first: wire AI into two low-risk, cost-bounded surfaces now
(the fictional `/example-report` demo, and a new admin-only preview against
real data) rather than waiting for the Supabase/Stripe live-report wiring
(`OPEN_RISKS.md` #14) to exist. `buildPremiumReportData` itself is
untouched and still pure/deterministic (its "never fabricates" test still
passes unchanged) — AI is a separate, optional enrichment step layered on
top.

- **`@anthropic-ai/sdk` added.** `src/lib/ai/anthropic-client.ts`: lazy
  client, same pattern as Stripe/Resend/Supabase (importing the module
  never fails before `ANTHROPIC_API_KEY` is set).
- **`src/lib/ai/study-extraction.ts`:** per-study structured extraction via
  tool-use (forced `tool_choice`, not free-text parsing) — population,
  intervention, outcome, result, uncertainty, limitations, funding/
  conflicts. System prompt hard-constrains the model to only report what's
  explicitly in the given title/abstract, null for anything not stated,
  and never turn correlation into causation — the same evidence-integrity
  rules `CLAUDE.md` already enforces everywhere else, now enforced via
  prompt instead of just null defaults.
- **`src/lib/ai/report-synthesis.ts`:** cross-study synthesis (key
  findings, a short synthesis paragraph, a practical-interpretation
  paragraph) from the already-extracted per-study summaries — system
  prompt encodes `08_EVIDENCE_SAFETY_AND_CONFIDENCE_MODEL.md`'s rules
  (never claim causation from correlation, never equate absence of
  evidence with evidence of absence, no individualized advice, reflect
  disagreement between studies honestly rather than smoothing it over).
- **`src/lib/ai/report-enrichment.ts`:** the glue — checks
  `AI_EXTRACTION_ENABLED`/`ANTHROPIC_API_KEY`, calls the two modules above,
  and merges the results into a `PremiumReportData`; returns the report
  **unchanged** if AI isn't configured or if anything fails (a thrown
  error, a malformed response) — fails safe, never crashes the page, never
  fabricates.
- **`PremiumReportData` gained `synthesisText`/`practicalInterpretationText`**
  (the actual prose — the existing `synthesisAvailable`/
  `practicalInterpretationAvailable` booleans were tracked from Phase 8 but
  nothing ever rendered when true, since there was no field to hold the
  text). `PremiumReportView`'s synthesis/interpretation sections now render
  this text when present.
- **Wired into `/example-report`:** the fixed fictional demo data now runs
  through real AI enrichment, cached per locale for 24h via Next's
  `unstable_cache` — a real API call happens at most once a day per
  locale, not once per visitor (this sandbox has no
  `ANTHROPIC_API_KEY`/`AI_EXTRACTION_ENABLED`, so it correctly falls back
  to the existing honest "not yet available" state, live-verified via
  screenshot). Three of the five placeholder abstracts (the ones already
  marked `dataCompleteness: "abstract"`) were rewritten with substantive
  — still clearly `[Platzhalter]`-labeled fictional — content (a positive
  RCT result, a mixed systematic review, a null-result narrative review)
  so the demo can actually showcase the synthesis handling disagreement
  between studies, not just extract "Nicht angegeben" from vague filler
  text. The two `metadata_only` placeholders correctly keep no abstract.
- **New `/admin/report-preview`:** admin-gated (same `requireAdminSession`
  as the rest of `/admin`), runs a real search (typed question + topic)
  through the actual pipeline plus AI enrichment, and renders the real
  `PremiumReportView` — this is the tool for judging AI synthesis quality
  against genuine evidence before deciding whether to build the full
  persisted-report flow. Deliberately not public: an ungated live-AI page
  would let any visitor (or bot) trigger paid API calls.
- 9 new unit tests (`study-extraction`, `report-synthesis`,
  `report-enrichment` — both the disabled/unconfigured path via the real
  `serverEnv` and the enabled path via a mocked `serverEnv` module, per the
  existing `check-free-search-limit` testing pattern in this codebase; no
  real network calls in any test) + updated `premium-report.test.ts`
  assertions for the two new fields. 246 unit tests + 1 integration test,
  48 Playwright specs; `npm run verify` passes. Visually confirmed live:
  `/example-report` still degrades honestly with no key configured, the
  shortened pending-AI notices render correctly, and `/admin/report-preview`
  is properly auth-gated.
- **Not done, deliberately:** the real `/search` → paid checkout → stored
  report flow still doesn't exist (`OPEN_RISKS.md` #14) — that's "Option B"
  from this conversation, intentionally deferred until AI quality is
  judged worthwhile via the admin preview tool above.

### Idle-time polish pass: favicon/OG image, accessibility, feedback admin (Erwin's request)
While Erwin worked on obtaining `ANTHROPIC_API_KEY`, he asked me to use the
time productively; after a first `npm audit` triage (see below) he then gave
a broader mandate: implement both proposed items, run further detailed tests
and fixes, and propose/implement graphic and UI improvements directly where
judged beneficial.

- **`npm audit` triage (no code change).** 12 high-severity findings, all
  traced to either ESLint's dev-only dependency chain (`brace-expansion`/
  `minimatch` via `@eslint/config-array`) or dependencies bundled inside
  Next.js itself (`postcss`, `sharp`) — none reachable from this app's
  runtime. The suggested `npm audit fix --force` would have downgraded
  `next` to `9.3.3` or forced a breaking ESLint major bump, so it was
  deliberately **not** applied; documented here instead of silently ignored.
- **Branded favicon + dynamic OG/social image.** `src/app/icon.svg` (the
  TEKMESIS shield mark, replacing the generic Next.js starter
  `favicon.ico`) and `src/app/opengraph-image.tsx` (a 1200×630 PNG built
  with Next's `ImageResponse`/Satori — no external image tool or static
  asset needed) are both Next.js file-convention metadata, auto-picked up
  with no manual `<meta>` wiring. Twitter card type upgraded to
  `summary_large_image` to match. Live-verified: fetched both routes and
  confirmed a real PNG / valid SVG. See `OPEN_RISKS.md` #17(a).
- **Accessibility deep-dive beyond the existing automated `@a11y` suite.**
  Ran an ad-hoc `best-practice`-tagged axe scan (broader than the
  `wcag2a`/`wcag2aa`/`wcag22aa` tags already enforced in `e2e/*.spec.ts`)
  across all 7 pages — 0 violations. Reasoned manually about a gap
  automated tools don't catch: sighted keyboard-only users have no
  screen-reader landmark-jump shortcut, so a skip-to-content link has real
  value even with 0 automated "bypass blocks" violations. Added a
  `sr-only`/`focus:not-sr-only` skip link as the first element in
  `<body>` (`src/app/layout.tsx`) jumping to a new `#main-content` wrapper,
  with a `dict.nav.skipToContent` string in both `de.json`/`en.json`, plus
  a new e2e test confirming it's the first focusable element and has the
  right `href`.
- **Admin feedback/issue-report sections (`OPEN_RISKS.md` #15).** Built the
  piece of Phase 9 that was deferred as an empty shell: `FeedbackRepository`
  and `IssueReportRepository` (interface + in-memory + Supabase
  implementations, following the exact pattern of the existing payment/
  webhook/audit-log repositories, including the standard "untested against
  a live database" comment). `src/lib/admin/issue-actions.ts` adds
  `resolveIssue`/`dismissIssue`, each unconditionally recording an audit-log
  entry like every other admin action in this codebase. New
  `/admin/feedback` page (linked from `/admin`) lists gemeldete Probleme
  (with resolve/dismiss buttons on open issues) and Feedback (rating/
  comment), degrading gracefully with the same "Datenbank nicht verbunden"
  banner pattern as `/admin/payments` when Supabase isn't configured. 7 new
  unit tests (253 total) plus a new Playwright spec confirming the page
  reaches the graceful-degradation state live. **Not built:** any
  public-facing UI that actually writes to these tables — this is
  admin-side plumbing only, so the tables stay empty until a feedback-
  submission or issue-report form exists somewhere in the product.
- All three items verified together: `npm run lint`, `npm run typecheck`,
  `npm run test -- --run` (253/253), `npm run test:e2e` (50/50, up from 48),
  and `npm run build` all pass.

### Bug-hunt pass across recent AI wiring (Erwin's request, continued)
Erwin asked for a further round of detailed testing to find and fix anything
possible. Reviewed the AI extraction/synthesis modules (the newest and
riskiest code, since it parses output from an external LLM) and the new
admin feedback/issue-report code for edge cases.

- **Found and fixed: unvalidated AI tool-response shape could crash the
  report page.** `study-extraction.ts` and `report-synthesis.ts` cast the
  Anthropic tool-use response straight to their TypeScript result types
  (`toolUse.input as ExtractedStudyFields` / `as ReportSynthesisResult`) with
  no runtime check. Forced `tool_choice` makes a schema-conforming reply
  likely but the SDK/API give no hard guarantee — a subtly wrong shape (e.g.
  `keyFindings` returned as a string instead of an array) would not throw
  inside `report-enrichment.ts`'s try/catch (assigning bad data doesn't
  throw), so the malformed value would flow straight into
  `PremiumReportData` and crash at render time in `PremiumReportView`
  (`report.keyFindings.map(...)` on a non-array). Fixed by validating both
  responses with a Zod schema (`zod` was already a dependency for env
  validation) and returning `null` — the module's existing "AI unavailable"
  fallback — on any mismatch, so a malformed reply now degrades the same
  way an absent API key does, never crashes the page. Added one unit test
  per module reproducing a malformed response (255 unit tests total).
- **Checked and found sound, no change needed:** `/admin/report-preview`'s
  AI calls are bounded to at most `DETAILED_RESULTS_CAP` (15, decision #8)
  parallel extraction calls plus one synthesis call per generation — no new
  unbounded-cost path was introduced. The new `/admin/feedback` page only
  reads/updates rows via the admin-gated action functions; nothing yet
  writes to `feedback`/`issue_reports` from a public route, so there is no
  new unauthenticated-input surface to harden yet (tracked as a known gap,
  not a bug, in `OPEN_RISKS.md` #15). `issue-actions.ts`'s "not found" error
  on an unknown issue ID matches the same throw-on-not-found convention
  already used by the report repositories.
- Verified together: `npm run verify` (lint, typecheck, 255 unit tests, 1
  integration test, build) and `npm run test:e2e` (50/50) all pass.

### Design pass: branded 404 page (Erwin's request, continued)
The root app had no `not-found.tsx`, so a mistyped or dead link fell through
to Next.js's generic, unbranded default 404 — the one place in the app that
still broke the "premium, calm, credible" visual language `CLAUDE.md`
requires everywhere else.

- **New `src/app/not-found.tsx`**: same panel/typography language as the
  rest of the site (renders inside the existing header/footer via
  `layout.tsx`), a small custom line-art illustration (document +
  magnifying glass — reusing the "searched, found nothing" motif for
  "page not found") in the same 24×24-viewBox / `currentColor` /
  rounded-cap style as `src/components/icons`, plus CTAs back to the
  homepage and `/topics`. Deliberately does **not** touch `TekmesisLogo` —
  its icon-left-of-wordmark layout is fixed by earlier explicit instruction
  and isn't varied here.
- New `notFoundPage` dictionary keys in `de.json`/`en.json`. Live-verified
  with a screenshot at `/this-page-does-not-exist` before writing tests.
- Added to `e2e/site.spec.ts`'s existing content-page heading/`@a11y` loop,
  plus a dedicated test confirming the route actually returns HTTP 404 (not
  just a 200 page that looks like an error) and that the home CTA works.
- Verified: `npm run verify` and `npm run test:e2e` (53/53, up from 50) both
  pass; `next build` lists a new `/_not-found` route.

### Design pass: brand the transactional email templates (Erwin's request, continued)
`src/lib/email/templates.ts` (report-ready, report-failed, refund
confirmation — the emails a real customer actually receives) were plain
unstyled `<div>`/`<p>` HTML with no branding at all, the one remaining
surface that didn't match the site's visual language.

- `wrapEmail()` now renders a table-based, fully inline-styled card (email
  clients don't load stylesheets): a navy (`#0b2540`) header bar with the
  TEKMESIS wordmark, a white content area, and a footer using the same
  neutral-600/neutral-400 hierarchy as the rest of the site — all colors
  are the exact hex values from `globals.css`'s design tokens, not
  approximations.
- The report-ready email's link is now a teal pill-shaped CTA button
  (`emailButton()`) with a plain-text fallback link underneath, instead of
  a bare hyperlink; the other two templates' `mailto:` links are styled
  consistently (`emailLink()`).
- No content changed — same subjects, same body copy, same evidence-
  integrity guarantee (still takes no question/report-content parameter,
  so nothing sensitive can leak in). All 6 existing tests pass unchanged
  plus 1 new test asserting the branded header renders in every template.
  Visually verified by rendering the report-ready email's HTML to a file
  and screenshotting it in a real browser.

### Design pass: polish the paywall panel (Erwin's request, continued)
`PaywallPanel` (rendered on `/search` once a question is eligible — the
actual CHF 9.90 purchase-decision moment) used a literal `"✓ "` text glyph
in front of each feature and had flat, undifferentiated spacing between
the feature list, the price, and the honest "checkout coming soon"
disclaimer.

- Replaced the text glyph with a small line-icon checkmark matching the
  24×24/`currentColor`/rounded-cap style already used by
  `src/components/icons`.
- Added a divider before the price block so price/refund/version info
  reads as a distinct group from the feature list, and bumped the price to
  a slightly larger weight to match its role as the key decision number.
- No content or functional change — same dictionary strings, same honest
  "Stripe checkout not wired up yet" disclaimer box (`OPEN_RISKS.md` #14 is
  unchanged; this was styling only, not a claim that checkout works).
  Visually verified live via a temporary throwaway preview route (created,
  screenshotted, then deleted — never committed). `npm run verify` and
  `npm run test:e2e` (53/53) both pass.

### Design pass: leading icons on status notices (Erwin's request, continued)
`HighRiskNotice`, `SearchLimitNotice`, `NotEligibleNotice`, and
`SearchFailedNotice` — the four `/search` guard-rail panels — had no visual
marker distinguishing "warning" from "informational," just color and copy.

- New shared `src/components/icons/notice-icons.tsx`: `WarningIcon`
  (triangle) for the two amber warning-style panels, `InfoIcon` (circled
  "i") for the two neutral white panels — same 24×24/`currentColor`
  line-icon style as the rest of `src/components/icons`.
- Icons sit `aria-hidden` next to each heading; the heading's accessible
  name is unchanged, so none of the existing `getByRole("heading", {name})`
  e2e assertions needed updates. Visually verified live (screenshots of the
  high-risk and search-failed states).
- `npm run verify` and `npm run test:e2e` (53/53) both pass.

### Design pass: homepage hero illustration (Erwin's request, continued)
Erwin's feedback after the icon/notice polish: "what's still missing is
images" — everything up to this point had been small line icons and layout
polish, no actual illustration. Asked which direction to take (custom
vector illustrations vs. Erwin supplying photos vs. stock photography);
Erwin chose custom vector illustrations, which also matches what's
possible in this environment — there is no photo/AI-image-generation tool
available here.

- New `src/components/hero-illustration.tsx`: a hand-coded SVG that
  literalizes the brand claim ("FROM STUDIES TO CLARITY.") — a scattered
  cluster of three study-document rectangles (rotated, layered, muted
  tones) on the left, a dotted converging path, and one clean checked
  report on the right. Built entirely from the existing brand palette
  (navy-900, teal-600, neutral-200/50) so it reads as part of the same
  design system as the line icons rather than a bolted-on graphic.
- Placed on the homepage between the H1 and `LiveDemoPreview` — the
  reading path is now claim → illustration of the claim → live proof of
  the claim → CTA. `aria-hidden`, purely decorative, doesn't affect the
  page's accessible structure.
- Live-verified via a full-page screenshot; `npm run verify` and
  `npm run test:e2e` (53/53) both pass unchanged (no new failures, no
  a11y regressions on the home page's existing `@a11y` test).

### Design pass: screening-funnel illustration on /methodology (Erwin's request, continued)
`/methodology` explains the search/dedup/screening/eligibility pipeline in
a plain numbered list with no visual reinforcement of the actual claim
("we screen rigorously, not just dump everything found").

- New `src/components/methodology-funnel-illustration.tsx`: scattered
  candidate-hit squares along the top, narrowing through a funnel shape
  down to a handful of included-study squares at the bottom — a literal,
  wordless depiction of what the page's copy already says in prose. Same
  brand palette and hand-coded-SVG approach as `hero-illustration.tsx`
  (still no image-generation tool available in this environment).
- Placed above the numbered step list on `/methodology`, between the
  intro paragraph and the steps grid.
- Live-verified via screenshot; `npm run verify` and `npm run test:e2e`
  (53/53) both pass, including the existing `/methodology` `@a11y` check
  (the illustration is `aria-hidden`).

### Search scope filters: publication age + study type (Erwin's request)
Erwin asked whether the own-question flow should offer scope-restriction
filters (his examples: country of study, publication age) and, if I judged
them worthwhile, to propose the most important ones and build them
directly.

- **Analysis first.** Checked what the four source adapters
  (OpenAlex/Crossref/Europe PMC/NCBI) actually expose per `NormalizedRecord`
  before promising anything: `year` and `publicationType` are already
  populated for every record, so an age filter and a study-design filter
  are honestly buildable today. A **country-of-study filter is
  deliberately not built** — none of the four adapters currently extract a
  country field at all, and the only close approximation (OpenAlex
  author-institution country) reflects where *researchers* are affiliated,
  not the study *population*, and is only available from one of four
  sources. Building it would have meant either quietly working for a
  fraction of results or silently misrepresenting source coverage — both
  violate `CLAUDE.md`'s "never invent source coverage" rule. Documented as
  a considered-and-rejected option, not a silent gap.
- **New `src/lib/search/filters.ts`:** `SearchFilters` (`maxAgeYears`,
  `studyTypes`), `applyFilters()` (runs after evidence-quality screening,
  before ranking — a separate concept from `ExclusionReason`, since this
  is user-chosen scope restriction, not an evidence-quality judgment), and
  `parseFiltersFromParams()` for the URL-query-string → filter mapping.
  Age filtering never guesses: a study with an unknown year is excluded
  when an age filter is active rather than assumed to pass it, matching
  the "unknown stays null, never guessed" rule. The 11 non-protocol
  `PublicationType` values are grouped into 4 user-facing checkboxes
  (reviews/meta-analyses, RCTs, observational studies, other) that
  together cover every value, so "all four checked" is verifiably
  equivalent to "no filter" — `protocol` itself is already excluded by
  screening regardless of any filter.
- **Wired end to end:** `runSearch`/`runSearchWithAdapters` take an
  optional `SearchFilters` (defaulting to no restriction, so every
  existing caller — `/example-report`, `/admin/report-preview` —
  is unaffected); `SearchRunResult` gained `filtersApplied` and
  `excludedByFilterCount`, threaded through `TeaserData` so the free
  teaser discloses how many studies a filter excluded (same transparency
  pattern as `sourcesUnavailable`). The filter UI lives in
  `QuestionClarification` (the existing "confirm domain and search" step)
  as a plain GET form — no client JS needed, consistent with the rest of
  the search flow — and its selections travel as ordinary `/search` query
  params (`maxAgeYears`, `studyTypeGroup`), preserved through the
  search-failed retry link.
- 26 new unit tests (filters.ts + run-search.ts integration) and 2 new
  e2e specs (filter UI renders with everything selected by default;
  choosing filters produces the right query params) — `npm run verify`
  and `npm run test:e2e` (55/55) both pass. Live-verified via screenshots:
  the filter panel, and the resulting `/search` URL after narrowing to a
  10-year age limit with one study-type group unchecked.

### "Compare a study you already have" (Erwin's request)
Erwin's second idea in the same message: if someone already has a specific
study, they should be able to compare it against the rest of the available
evidence as an alternative to typing a free-text question. Assessed it as
sensible and feasible, and built it as its own unit of work (kept separate
from the filters feature above so both stay independently reviewable).

- **New `lookupByDoi()` in `src/lib/source-adapters/crossref.ts`:** a
  direct single-record fetch (`/works/{doi}`) reusing the adapter's
  existing `toNormalizedRecord` mapper, returning `null` for a genuine
  404 and still throwing for a real failure (network/5xx) — the same
  fail-safe-vs-fail-honest distinction used everywhere else in this
  codebase. Scoped to Crossref only for v1 (its DOI registration covers
  virtually any published DOI across fields) rather than also wiring
  OpenAlex/Europe PMC/NCBI lookup — one reliable source beats three more
  integration points for a first version; revisit if Crossref coverage
  turns out to be a real gap once a live API key/network exists to test
  against.
- **Bug fixed along the way:** `fetchJson` (`src/lib/source-adapters/http.ts`)
  threw a *new* `SourceAdapterError` after exhausting retries that didn't
  carry forward the original response's HTTP status — so a 404 from the
  lookup call looked identical to a network failure once retries were
  involved, breaking the "not found vs. real error" distinction `status`
  was added for. Fixed to propagate the last error's status onto the
  final thrown error; covered by a new `http.test.ts` case.
- **New `src/lib/search/study-lookup.ts`:** `parseDoiInput()` accepts what
  someone is likely to paste (bare DOI, `doi.org` URL, `doi:` prefix,
  copy-paste whitespace/punctuation) and returns `null` for anything not
  DOI-shaped, so an obviously-invalid input shows an honest "invalid DOI"
  state instead of attempting a doomed lookup.
- **`runSearch`/`runSearchWithAdapters` gained `excludeDoi`:** the seed
  study is removed from the candidate pool before `candidateCount` is even
  computed (not screened out later), since it's being shown separately as
  "your study," not evaluated as one of the studies it's compared against.
  `normalizeDoi` (previously private to `dedupe.ts`) is now exported and
  reused here for the DOI comparison.
- **`/search` accepts a `doi` param** as an alternative to `q`: resolves
  it via `lookupByDoi`, uses the found study's title as the search query
  through the *same* existing classification/clarification/screening/
  ranking pipeline (no parallel code path), and renders a new
  `SeedStudyPanel` ("Deine Studie") above the usual `FreeTeaser` results.
  Three honest failure states, each visually verified live: an unparseable
  DOI, a genuine 404 (not built to be distinguishable from a network
  failure in this sandbox, since there's no outbound network access here
  either way — both correctly reach the same honest "couldn't retrieve"
  notice rather than a false "not found" claim), and — new —
  `QuestionClarification` carries the DOI forward as a hidden field so
  confirming a domain doesn't lose it.
- **New `StudyLookupForm`** on the homepage next to `OwnQuestionForm` (a
  plain GET form, no client JS, same pattern as the rest of this flow).
- 19 new unit tests (crossref lookupByDoi + http.ts status-propagation fix
  + study-lookup.ts DOI parsing + run-search.ts excludeDoi behavior) and 4
  new e2e specs. The "found study → comparison results" success path
  can't be exercised live in this sandbox (no outbound network access to
  Crossref, same constraint already documented for the question-based
  flow's search-failed test) — covered instead by the crossref unit tests
  (mocked fetch) plus live-verified UI/routing for both DOI failure
  states. `npm run verify` and `npm run test:e2e` (59/59) both pass.

### Fix: unequal card heights on the home/topics own-question row + add the study lookup to /topics (Erwin's feedback on the live deploy)
Erwin's repo turned out to have no separate `main` branch —
`claude/takemesis-mvp-app-f622xx` is the repository's only and default
branch, so what looked like "still needs a PR" was actually already live
via Vercel once he checked; this was a mistaken assumption on my part,
corrected once verified via `list_branches`/`list_pull_requests` (0
branches besides this one, 0 PRs). He then reported two real issues from
the live site:

- **The two homepage cards (`OwnQuestionForm`/`StudyLookupForm`) had
  visibly different heights**, submit buttons misaligned, because the
  shorter card's content just stopped early — the flex row used
  `lg:items-start` (natural per-item height) instead of stretching.
  Fixed: the row is now `lg:items-stretch`, and each form is `h-full`
  with `mt-auto` on its submit button, so both cards match the row's
  height (driven by whichever is taller) and both buttons align at the
  bottom regardless of content length.
- **`/topics` never got the "compare a study you already have" entry** —
  it only ever had `OwnQuestionForm` standalone; the DOI-lookup feature
  (see the previous entry) was wired into the homepage only. Added
  `StudyLookupForm` next to `OwnQuestionForm` on `/topics` too, in the
  same side-by-side layout as the homepage.
- Live-verified via screenshots on both pages (equal-height cards on
  `/`, both forms present on `/topics`). `npm run verify` and
  `npm run test:e2e` (59/59) both pass unchanged.

### Full UI/UX audit pass (Erwin's request: "4 hours, test and optimize everything meticulously")
Screenshotted every page/state at desktop (1280×900) and mobile (390×844),
reviewed each image, and verified suspected issues against actual DOM/CSS
(`page.evaluate()`) before treating anything as real — this ruled out two
false alarms (see below) as well as confirming the real fixes.

- **Real bug found and fixed: leading icons on notice cards drift into the
  middle of multi-line headings on mobile.** All five status-notice
  components (`high-risk-notice.tsx`, `not-eligible-notice.tsx`,
  `search-failed-notice.tsx`, `search-limit-notice.tsx`,
  `study-lookup-notice.tsx`) pair a leading icon with an `<h1>` inside a
  `flex items-center` row. On desktop the headings mostly fit one line, so
  `items-center` looked fine; on a 390px-wide mobile viewport the
  high-risk-question heading wraps to three lines, and `items-center`
  centers the icon against the whole three-line block — landing it
  mid-sentence next to the second line instead of leading the heading.
  Fixed the same way across all five: `items-start` on the row plus `mt-1`
  on the icon (aligning it to the first line's cap-height instead of the
  block's vertical center). Verified against a live screenshot of the
  high-risk state at 390px before and after — icon now stays beside line
  one regardless of how many lines the heading wraps to, with no
  regression on the shorter two-line headings.
- **Real bug found and fixed: 7-item "How it works" / methodology-steps
  grids left an unbalanced empty gap in the last row.** Both the homepage's
  `howItWorksSteps` (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, 7 items)
  and `/methodology`'s `steps` (`grid-cols-1 sm:grid-cols-2`, 7 items) don't
  divide evenly into their column counts, so the last row's empty cell(s)
  sat as dead space on the right. Switched both from CSS Grid to
  `flex flex-wrap justify-center` with explicit per-breakpoint `calc()`
  widths, so an incomplete final row centers itself instead. Verified via
  screenshot on the homepage (items 05/06/07 now centered as a group); the
  methodology fix follows the identical pattern.
- **Real bug found and fixed: the "why not ChatGPT" comparison table hides
  a whole column on mobile with no indication more content exists.**
  Confirmed via `page.evaluate()` (`scrollWidth: 576` vs `clientWidth:
  340`, `overflowX: "auto"`) that the table needs horizontal scrolling on
  mobile but gave no visual cue — a mobile visitor could easily miss the
  entire "generic AI chatbot" column, which is the whole point of that
  section. Added a `sm:hidden` hint line above the table ("swipe the table
  right to see the chatbot comparison →").
- **False alarm, investigated and ruled out: the legal page's address line
  looked like a styled link in a screenshot.** `page.evaluate()` confirmed
  identical `color: rgb(76, 89, 102)` on both that line and the plain text
  above it, and neither is an `<a>`. No code change.
- **False alarm, investigated and ruled out: admin login appeared broken
  during the audit.** Reproducible against a plain `npm run dev`, but the
  full e2e suite (same login flow, same credentials) had just passed. Root
  cause: `playwright.config.ts`'s `webServer.env` sets
  `ADMIN_EMAILS`/`ADMIN_AUTH_SECRET` only for its own built+started server;
  a manually-run `npm run dev` doesn't inherit them. Restarted the dev
  server with those env vars set for audit purposes only — no code change.
- Every other screenshot (checkout success/cancel, 404, all `/search`
  failure/notice states, all admin pages, `/privacy`, `/legal`, `/about`,
  `/example-report`, both viewports) was reviewed and found clean.
- **Pre-existing e2e failures found while re-running the full suite,
  confirmed unrelated by stashing all of this pass's changes and
  re-running against the untouched baseline:** the rate-limit test in
  `search.spec.ts` and an intermittent header/console-error failure in
  `security-headers.spec.ts` both fail identically with zero code changes
  applied — see `OPEN_RISKS.md` #24 for the detail and a likely root
  cause. Not fixed in this pass since it's orthogonal to UI/UX and
  pre-dates it.
- `npm run lint`, `npm run typecheck`, `npm run test` (288/288),
  `npm run test:integration` (1/1), and `npm run build` all pass clean on
  the accumulated changes from this pass. `npm run test:e2e` passes
  55/59, with the 4 failures confirmed pre-existing per above.

### WOW-Zusatzleistungen: marketer brainstorm, then "setze alle um" (Erwin's request)
Erwin asked for a creative marketing brainstorm of value-add features rated
by impact/benefit/complexity, then said to implement all of them. Doing all
~20 to the same tested-and-documented standard as every other feature in one
pass wasn't realistic without cutting corners — several were self-rated
"Hoch" complexity or explicitly flagged as needing a real product decision
first (subscription-adjacent mechanics, new report types, translation
quality). Built everything that was genuinely buildable now without
fabricated content or an un-made policy call; deferred the rest with
reasoning in `OPEN_RISKS.md` #25 rather than rushing or silently skipping
them.

**Built (13):**
- **Glossary tooltips in the premium report** (`glossary-term.tsx`, wired
  into `StudyDesignBadge` and the "Evidenzsicherheit" heading): click/tap
  popover definitions for every study-design term and two general
  methodology terms, sourced from a new `glossaryDefinitions` dictionary
  section — not hover-only, so it works the same on touch.
- **Publication-year timeline chart** (`publication-timeline-chart.tsx`):
  a plain-div bar histogram in the Evidence Landscape section, built from
  `report.comparison`'s per-study years; studies with an unknown year are
  counted separately in a note rather than silently dropped.
- **Citation export (BibTeX/RIS)** (`lib/reports/citation-export.ts` +
  `citation-export-buttons.tsx`): `PremiumSourceEntry` gained structured
  `authors`/`year`/`title`/`venue` fields (same underlying data the
  citation string was already built from, just not pre-joined) so export
  omits unknown fields instead of inventing placeholder text.
- **Read-aloud** (`read-aloud-button.tsx`): browser-native
  `SpeechSynthesis` for the Key Findings section; the button itself is
  omitted (not shown-disabled) when the API or the content isn't there.
- **Live source-status page** (`source-status-panel.tsx`, added to
  `/sources` behind `Suspense`): actually calls each of the 4 adapters'
  existing `checkStatus()` — this was already-built, unused
  infrastructure (`registry.ts`'s `checkAllSourceStatuses`) that had no
  UI anywhere until now.
- **Local search history** (`lib/search-history/local-history.ts`,
  `recent-searches-panel.tsx`): purely `localStorage`, never sent to the
  server or analytics, capped at 8, with per-item and clear-all removal.
  Recorded only on genuinely completed searches (the teaser-shown
  branch), not on every intermediate state.
- **Voice input** (`voice-input-button.tsx`): Web Speech API dictation
  into the own-question textarea; hidden entirely on browsers without the
  API (currently Firefox) rather than shown-but-broken.
- **Shareable Evidence Card** (`/api/evidence-card`, `next/og`
  `ImageResponse`, opt-in link on the free teaser): only ever carries what
  the user already typed themselves plus the already-public confidence
  label and topic name — never study titles or anything from the paid
  report, and only generated when the user clicks "share", never
  automatically.
- **Localized emergency contacts**: the high-risk notice's single
  Switzerland-only hotline became a short, explicitly-labeled
  non-exhaustive list (CH/DE/AT/US/UK) with a note to look up the local
  number elsewhere — real, well-established public crisis lines, not
  invented.
- **In-report follow-up chat** (`lib/ai/report-chat.ts` +
  `report-chat-widget.tsx` + `/api/report-chat`): same tool-forced,
  schema-validated pattern as the existing synthesis/extraction AI
  modules. The system prompt requires every answer be grounded only in
  this report's own studies, explicitly refuses to fall back on general
  knowledge, treats study text as data rather than instructions, and can
  honestly say "not answerable from this report's studies"
  (`answerableFromReport: false`) instead of guessing. Gated the same way
  as the rest of AI enrichment — `AI_EXTRACTION_ENABLED` +
  `ANTHROPIC_API_KEY` — and only rendered where `PremiumReportView`
  already appears (the admin preview and the public example-report demo;
  there's still no live paid-report viewer page, see `OPEN_RISKS.md`
  #16).
- **Gift/discount codes at checkout**: `createCheckoutSession` now sets
  `allow_promotion_codes: true` — Stripe's own native promo-code UI,
  configured from Erwin's real Dashboard once it exists, rather than a
  custom code-validation system. A genuine "buy now, redeem later as a
  gift" flow is a different, bigger feature (its own redemption-token
  system) and wasn't in scope here.
- **Admin one-click refund** (`lib/payments/refund.ts`,
  `lib/admin/payment-actions.ts`, a button on `/admin/payments`): the
  pre-existing `recordRefundedAction` only ever flipped the *Report's*
  internal status, on the assumption an admin had already refunded
  manually in the Stripe Dashboard — it never called Stripe and never
  touched the `Payment` row's own `refund_pending`/`refunded` status
  (defined in the schema, never wired to anything). This collapses that
  two-system manual process into one admin-authenticated action. Still
  admin-only, never customer-facing self-service, since it moves real
  money — see the reasoning in the commit/PR, not a silent scope
  decision.
- **Interactive methodology calculator** (`methodology-calculator.tsx`
  on `/methodology`): sliders for included/result-bearing/review-or-meta
  study counts, live-classified by the *actual* eligibility rule. Required
  extracting `deriveEligibilityStatus`/`estimateReportDepthFromCounts` as
  counts-only pure functions out of `eligibility.ts` (`assessEligibility`
  now calls them too) — a single source of truth shared by the real
  pipeline and the demo, so the demo can't quietly drift from what a real
  search actually decides.

**Deferred, with reasoning:** Themen-Digest E-Mail, Evidenz-Update-Check,
plus the five items already flagged as "bewusst nicht vorgeschlagen" in the
original brainstorm (Mythen-Rubrik, Entscheidungsassistent,
Vergleichsrechner, FR/IT, Evidenz-Trend-Indikator) — see `OPEN_RISKS.md`
#25 for the full reasoning per item.

`npm run lint`, `npm run typecheck`, `npm run test` (326/326),
`npm run test:integration` (1/1), and `npm run build` all pass clean on the
accumulated changes. `npm run test:e2e` passed 59/59 on this run — the two
pre-existing failures tracked in `OPEN_RISKS.md` #24 are intermittent, not
consistently reproducing every run, and didn't surface this time.

### Beispielfragen-Check: 8 von 60 waren defekt (Erwin's request)
Erwin bat darum, alle Beispielfragen (12 Themen × 5, DE+EN) durchzuprüfen und
kaputte durch funktionierende zu ersetzen. Ein echter Live-Check
(`checkExampleQuestionsForTopic`, task #86) war nicht möglich — diese
Sandbox hat keinen Netzwerkzugriff zu keiner der 4 Quellen (bestätigt per
`curl`: 403 auf OpenAlex/Crossref/Europe PMC/NCBI). Stattdessen wurde
geprüft, was ohne Netzwerk ehrlich prüfbar ist: ob jede Beispielfrage (a)
den unabhängigen High-Risk-Filter besteht und (b) beim Domain-Klassifikator
tatsächlich auf ihr eigenes Thema matcht — beides reine, lokale Logik, die
jede Frage vor einer echten Suche ohnehin durchläuft. Als permanenter Test
hinzugefügt: `src/content/topics-example-questions.test.ts` (240 Checks:
60 Fragen × 2 Prüfungen × ist bereits pro Sprache separat).

8 von 60 Fragen sind durchgefallen — echte, gefundene Bugs, keine
Kleinigkeiten:

- **Systemischer False-Positive-Bug im High-Risk-Filter:** Der Begriff
  `"scheidung"` (für `legal_financial_high_stakes`, gedacht für
  "Scheidung"/Ehescheidung) ist ein reiner Teilstring-Match ohne
  Wortgrenzen (`haystack.includes(term)`) — und steckt zufällig in
  "**Ent**scheidung(en)", einem der häufigsten deutschen Wörter überhaupt.
  Betraf 4 von 5 Beispielfragen in "Konsum & Kaufentscheidungen" (einem
  Thema, dessen Name selbst "Kaufentscheidungen" enthält!) sowie eine
  Frage in "Umwelt, Nachhaltigkeit & Alltag". Das ist kein reines
  Beispielfragen-Problem — jede echte Nutzerfrage mit "Entscheidung"
  würde in Produktion fälschlich als Hochrisiko blockiert. Bewusst NICHT
  per allgemeiner Wortgrenzen-Regex im Detektor selbst gefixt: deutsche
  Komposita (z. B. "Blutkrebs", "Hautkrebs" für den `cancer`-Begriff
  "krebs") brauchen den Treffer oft gerade als Wortende, eine pauschale
  Grenzprüfung hätte dort echte Treffer zu False Negatives gemacht — beim
  Sicherheits-Gate laut eigenem Design-Kommentar der klar schlimmere
  Fehler. Stattdessen wurden die betroffenen Beispielfragen so
  umformuliert, dass sie "Kaufverhalten"/"Mobilitätsformen" statt
  "Kauf-/Konsum-/Mobilitätsentscheidungen" verwenden. Der Begriff
  `"scheidung"` selbst bleibt im Detektor unverändert — das ist ein
  eigenständiger, dokumentierter Risikoeintrag (`OPEN_RISKS.md` #26),
  kein an dieser Stelle stillschweigend gelöster Bug.
- **Ein echter negations-bedingter False Positive:** "nicht-medikamentöse
  Ansätze" (gesundheit-praevention) enthält den Begriff "medikament" und
  wird als `prescription_drugs` geflaggt — obwohl die Frage explizit nach
  NICHT-medikamentösen Ansätzen fragt. Der Detektor versteht keine
  Negation (bewusst so einfach gehalten, siehe Datei-Kommentar). Fix: die
  Beispielfrage umformuliert, um das Wort ganz zu vermeiden, statt zu
  versuchen, Negation zu erkennen.
- **3 Domain-Fehlklassifizierungen:** "How does active listening work?"
  matchte stärker auf "Arbeit, Produktivität" (wegen "work") als auf
  "Beziehungen & Kommunikation"; "Verbessern KI-Tools Produktivität oder
  Lernleistung?" matchte auf "Arbeit, Produktivität" statt "Technologie &
  Digital Life"; "What effect does digital screen time have on sleep
  quality?" matchte stärker auf "Schlaf & Regeneration" als auf sein
  eigenes Thema. Alle drei durch Umformulierung behoben (klarere,
  themen-eindeutigere Begriffe), gegen den echten Klassifikator
  verifiziert statt geraten — der Domain-Index wird dynamisch aus
  Themenname/-beschreibung/-beispielen aufgebaut, ist also
  selbstreferenziell: jede Änderung an einer Beispielfrage verschiebt den
  Index für dieses Thema mit.
- Alle 8 Ersatzfragen gegen den echten Code verifiziert (nicht geraten),
  DE/EN-Paare inhaltlich neu abgeglichen wo die Bedeutung sich verschoben
  hat. `npm run lint`, `npm run typecheck`, `npm run test` (566/566,
  vorher 326 + 240 neue) und `npm run build` bestehen.
- **Nicht behoben, weil nicht live prüfbar:** ob die 60 Beispielfragen
  tatsächlich genug echte Studien finden, um als Report angeboten zu
  werden (`eligibility.status !== "not_eligible"`), bleibt offen — das
  braucht echten Netzwerkzugriff zu den 4 Quellen. Siehe
  `OPEN_RISKS.md` #26.

### Konzept: wachsender Studien-Wissensspeicher (Erwin's request, not implemented)
Erwin fragte, wie ich die Idee eines dynamisch aktualisierten Verzeichnisses
aller Studien beurteile. Antwort: als "alle Studien" nicht sinnvoll (siehe
Chat — das wäre der Aufbau einer Konkurrenz-Datenbank zu OpenAlex/Crossref/
Europe PMC/NCBI, widerspricht der bewussten "kein eigener Korpus,
Live-Suche"-Architektur). Die kleinere, sinnvolle Variante — nur bereits
durch echte TEKMESIS-Suchen gefundene Studien lokal cachen, primär für
KI-Extraktions-Kosten/Konsistenz, nie als Ersatz für die Live-Suche — wurde
auf Wunsch in `docs/CONCEPT_STUDY_KNOWLEDGE_BASE.md` ausgearbeitet:
Datenmodell, Speicherwachstums-Schätzung, bewusster Verzicht auf das Cachen
roher Abstracts (Lizenz-Vorsicht), Phasierung und offene Fragen für Erwin.
**Nicht implementiert** — reines Konzept-Dokument, wartet auf Freigabe per
`CLAUDE.md`'s "No implementation before concept approval".

### Studien-Wissensspeicher implementiert, Phase A (Erwin approved)
Erwin gab grünes Licht ohne die einzelnen offenen Fragen aus §5 des
Konzeptdokuments zu beantworten — die bleiben offen, insbesondere die
Source-ToS-Prüfung. Umgesetzt: `studies`-Tabelle exakt nach Skizze
(`supabase/migrations/20260727090000_add_studies_cache.sql`),
`src/lib/studies/` (Repository-Interface, In-Memory- und
Supabase-Implementierung), Read-through-Cache in
`src/lib/ai/report-enrichment.ts` (Cache-Hit überspringt den Anthropic-Aufruf,
Cache-Miss extrahiert live und schreibt fire-and-forget zurück, Cache-Fehler
werden abgefangen und geloggt statt propagiert). `npm run verify` grün.
Bekannte Lücke, im Konzeptdokument vermerkt: `report-enrichment.ts` wird
aktuell nur von `/example-report` und der Admin-Vorschau aufgerufen — es gibt
noch keine echte Live-Pipeline für bezahlte Reports, die den Cache mit echtem
Traffic füllen würde.

### Erwin richtet echten ANTHROPIC_API_KEY ein — dabei kritischer Live-Bug gefunden und behoben
Erwin hat einen echten Anthropic-API-Key besorgt und in Vercel unter
`ANTHROPIC_API_KEY` (Production Environment Variables) hinterlegt — Anleitung
dazu in `docs/ANTHROPIC_API_KEY_ANLEITUNG.md`. `AI_EXTRACTION_ENABLED` bleibt
bewusst `false`, bis eine echte Report-Pipeline existiert, die es nutzt (siehe
oben). Verifikation der KI-Anbindung selbst konnte nicht von dieser Session
aus erfolgen — die Sandbox blockiert ausgehende Verbindungen zu beliebigen
externen Domains (Egress-Policy, bestätigt über die Proxy-Diagnose); Erwin
prüfte stattdessen selbst über `/example-report` im Browser.

Beim Versuch, live einen echten Report über `/search` zu erzeugen, scheiterten
3 von 3 ausprobierten Fragen (aus der Auswahl der 60 Beispielfragen) mit "zu
wenige vergleichbare Studien gefunden". Die Live-Status-Seite (`/sources`)
zeigte alle 4 Datenquellen als erreichbar — kein Netzwerk-/Konnektivitätsproblem.

**Root cause gefunden:** Kein Adapter (OpenAlex, Crossref, Europe PMC, NCBI)
hatte jemals eine Übersetzung oder Stichwort-Extraktion vor dem Absenden der
Suchanfrage — die rohe, oft deutsche Frage ging wortwörtlich als `query`/
`search`/`term`-Parameter an alle 4 APIs. Diese Datenbanken sind faktisch
englischsprachig indexiert; ein deutscher Fragesatz (inkl. Füllwörtern)
findet dort praktisch nie etwas. Betraf jede deutsche Suche seit Phase 4–6 —
nie aufgefallen, weil alle bisherigen Tests (inkl. des Live-Verify-Admin-Tools
aus Task #86) entweder gegen gemockte Adapter liefen oder nie tatsächlich mit
echtem Netzwerkzugriff ausgeführt wurden.

**Fix (Erwins Entscheidung: Wörterbuch zuerst, KI-Rückfalllösung als
separater, eigens freizugebender zweiter Schritt später):**
`src/lib/search/de-en-dictionary.ts` (kuratiertes DE→EN-Fachbegriff-Wörterbuch,
~250 Einträge, aus den bereits vorhandenen zweisprachigen Themen-Texten in
`content/topics.ts` plus allgemeinem Fachvokabular abgeleitet) +
`src/lib/search/query-translation.ts` (`buildSearchQuery(question, locale)`:
tokenisiert, übersetzt erkannte deutsche Begriffe, lässt unbekannte/bereits
englische Begriffe unverändert durch, entfernt Füllwörter). `runSearch`/
`runSearchWithAdapters` (neuer `locale`-Parameter) übergeben jetzt die
übersetzte Anfrage an die 4 Adapter — die Original-Frage bleibt unverändert
für Anzeige, Relevanzprüfung und künftige KI-Auswertung erhalten. Kein neuer
Kostenfaktor, keine neue Umgebungsvariable, funktioniert unabhängig vom
Anthropic-Key. `npm run verify` grün (581 Unit-Tests, +7 neue). Die
KI-Rückfalllösung (eigener Schalter `AI_QUERY_TRANSLATION_ENABLED`, nur
ausgelöst wenn die Wörterbuch-Suche zu wenige Treffer liefert) ist noch nicht
gebaut — nächster Schritt auf Erwins Zuruf.

### Nachtrag: derselbe Bug steckte noch ein zweites Mal im Screening
Erwin testete den obigen Fix live erneut mit derselben Frage — weiterhin "zu
wenige Studien gefunden". `runSearchWithAdapters` übersetzte zwar korrekt die
an die Adapter geschickte Suchanfrage, aber `screenRecords`/`rankRecords`
bekamen weiterhin die rohe, unübersetzte (deutsche) `question` — die
Relevanzprüfung (`relevance.ts`) verglich also deutsche Fragebegriffe gegen
die jetzt korrekt gefundenen, aber englischsprachigen Abstracts und sortierte
praktisch alles als "not_relevant" wieder aus. Derselbe Root Cause, zweite
Stelle im selben Code-Pfad, beim ersten Fix übersehen. Fix: `screenRecords`
und `rankRecords` in `src/lib/search/run-search.ts` bekommen jetzt ebenfalls
die übersetzte `sourceQuery` statt der rohen Frage — nur der zurückgegebene
`query`/`originalQuestion` (Anzeige) und alles nach dieser Funktion (KI-
Auswertung später) bleiben unverändert an der Original-Frage. Neuer
Regressionstest in `run-search.test.ts` deckt den vollen Pfad ab (deutsche
Frage → englischsprachiger Fund → tatsächlich eingeschlossen). `npm run
verify` grün (582 Unit-Tests). Noch nicht erneut von Erwin live bestätigt.

### Erwin bestätigt den Fix live, dann: Mehrfachauswahl von Themenbereichen (Erwin's request)
Beide Fixes oben funktionieren — Erwin bestätigte live mit derselben
Koffein/Schlaf-Frage: 56 Treffer, 36 eingeschlossen, drei klar passende
2025er-Studien in der Vorschau. Ein zweiter Test mit einer eigenen,
domänenübergreifenden Frage ("fringe benefits" / Mitarbeiterzufriedenheit
unter "Gesundheit & Prävention") lieferte schwächere, aber ehrlich als
"Begrenzte Evidenzsicherheit" gekennzeichnete Ergebnisse — kein Regressions-
Bug, sondern zwei echte, separate Beobachtungen: (a) mögliche
Fehlklassifizierung des Themenbereichs (HR-Frage landete unter dem
biomedizinischen Bereich, der primär PubMed/Europe PMC statt OpenAlex
abfragt) und (b) eine Wörterbuch-Lücke ("Mitarbeiterzufriedenheit" als
zusammengesetztes Wort nicht enthalten).

Erwin schlug vor, bei der Themen-Klärung eine Mehrfachauswahl (statt nur
einer Radio-Button-Wahl) zu erlauben — hätte das Fringe-Benefits-Beispiel
durch Kombination beider Quellenrouten direkt gelöst. Umgesetzt mit von
Erwin bestätigten Defaults:

- Max. 2 gleichzeitig wählbare Bereiche (`MAX_SELECTED_DOMAINS` in
  `src/app/search/page.tsx`); Checkboxen statt Radio-Buttons in
  `question-clarification.tsx`, weiterhin ohne Client-JS (reines GET-Formular).
- `adaptersForTopics()` (neu, `source-adapters/registry.ts`) — Vereinigung
  der Quellenrouten aller gewählten Bereiche, dedupliziert nach Adapter-ID.
- Report/Teaser zeigen beide Themennamen (`" / "`-getrennt); der
  "erhöhtes Risiko"-Hinweis erscheint, wenn mindestens ein gewählter Bereich
  `riskProfile: "elevated"` ist.
- `domain_classified`-Analytics-Event wird für jeden gewählten Bereich
  einzeln aufgezeichnet, zählt also für beide in "Meistgefragte Themen".
- `SearchRunResult.topicSlug` bleibt bewusst einwertig (nur Cache-Tagging/
  Admin-Anzeige, nicht eligibility-relevant) — der erste gewählte Bereich
  dient als "primär", während die Quellenabfrage bereits beide abdeckt.

`npm run verify` grün (585 Unit-Tests) plus alle 22 E2E-Tests in
`e2e/search.spec.ts` (inkl. neuem Mehrfachauswahl-Test und einem a11y-Check),
da die Radio→Checkbox-Änderung zwei bestehende E2E-Assertions betraf. Die
ursprüngliche Fehlklassifizierungs-/Wörterbuch-Lücke (a/b oben) bleibt eine
separate, noch offene Beobachtung — kein Blocker, aber ein Kandidat für die
geplante KI-Rückfalllösung.

## Blocking items tracked for later (do not block continued implementation)

- Treuhänder confirmation on Swiss MWST / EU cross-border VAT (`OPEN_RISKS.md` #1)
  — blocks live Stripe mode and real payments only.
- Live-network validation of the 4 source adapters (`OPEN_RISKS.md` #2) — the
  resilience path (all sources down) is confirmed working live in this
  sandbox; the success path (sources actually returning data) still needs a
  real run from an environment with network access.
- Live validation of the Supabase migration and Stripe checkout/webhook code
  (`OPEN_RISKS.md` #13) — nothing has touched a real database or a real
  Stripe account yet.
- Wiring the live UI to real report creation + a working checkout button +
  real premium-report generation on payment (`OPEN_RISKS.md` #14) — needs the
  credentials above first.
- AI-based extraction/synthesis for Phase 3 (query interpretation) and Phase 8
  (key findings, study-level extraction, integrated synthesis, practical
  interpretation) — needs `ANTHROPIC_API_KEY`, not yet provisioned.
- Live validation of email sending (Resend) and analytics forwarding
  (PostHog), plus the deferred Phase 9 admin sections (`OPEN_RISKS.md` #15).
- `CRON_SECRET` not provisioned and the daily expiry cron never triggered by
  a real scheduler; no secure-link report-viewer page exists yet to read
  report status back to a user (`OPEN_RISKS.md` #16) — needs a deployed
  Vercel project.
- Everything in `docs/PRODUCTION_RUNBOOK.md` §1–3 (Vercel project, live
  Supabase/Stripe/Resend accounts, Hostpoint DNS change, Treuhänder sign-off,
  a real payment, tagging `v0.1.0`) — all require Erwin's direct action per
  `CLAUDE.md`'s human-stop-conditions; this session will not and cannot
  perform them.

## Next step

Everything that was buildable without live credentials for the remainder of
`IMPLEMENTATION_PLAN.md` (Phases 11–13) is done as of this update:
`docs/INDEPENDENT_REVIEW.md`, `docs/PRODUCTION_RUNBOOK.md`,
`docs/SMOKE_TESTS.md` + `scripts/smoke-test.sh`. Erwin has since deployed a
real Vercel project on `claude/takemesis-mvp-app-f622xx` (auto-redeploy
confirmed on every push) and used it to run the first genuine live-network
test of the search pipeline, which is documented above. What remains is
entirely gated on Erwin provisioning real accounts/DNS/legal sign-off — see
`docs/PRODUCTION_RUNBOOK.md` for the exact ordered steps once that starts,
and `docs/OPEN_RISKS.md` for the full current risk register (including the
still-open OpenAlex-reachability question from the live test). The natural
next session should begin at `PRODUCTION_RUNBOOK.md` §1 once at least a
Supabase + Stripe-test-mode set of credentials exists alongside the now-live
Vercel project.

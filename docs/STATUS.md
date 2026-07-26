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

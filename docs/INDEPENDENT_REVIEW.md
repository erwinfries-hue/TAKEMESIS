# Independent Final Review

Conducted per `18_FINAL_INDEPENDENT_REVIEW_PROMPT.md`. Written as an
independent check against the actual code, tests, and configuration in this
repository at commit `4d749e4` (end of Phase 10) — not against prior status
claims. Every command below was actually run in this session; outputs are
summarized, not invented.

## Status update (2026-07-31) — read this before re-running the review

Everything below this note still reflects the **end-of-Phase-10** snapshot —
before Stripe went live, before the report viewer existed, before real
payments were ever processed. It has **not** been rewritten to match
current reality, since that would mean asserting things this session didn't
itself verify. What actually changed since, all live-confirmed the same day
(see `docs/OPEN_RISKS.md` #13, #14, #27, #29–#32 for full detail):

- Stripe is live (own restricted API key, own live Product/Price, live
  webhook), a real CHF 9.90 purchase completed end-to-end (checkout →
  webhook → generated report → confirmation email), and both a direct-
  Stripe and an admin-one-click refund were exercised against real money.
- The secure-link report viewer (item 17 below, "genuine gap") now exists
  and works — `/report/[token]` was live-verified multiple times today.
- Two real bugs found and fixed live: `/admin/payments` never recorded a
  `Payment` row (broke admin visibility + the refund action from item 19),
  and paid amount/currency weren't corrected for discounted (promo-code)
  checkouts.
- A real safety-gate false negative was found and fixed: the high-risk
  detector missed declined German adjective+noun phrasings (e.g. "bei
  einer psychisch**en** Krise") — see `OPEN_RISKS.md` #32.
- Full 12-topic × 3-locale (DE/EN/FR) live search sweep completed
  (`OPEN_RISKS.md` #27), including two more live translation-gap fixes.

**Still not done, and the reason a full re-run/GO call shouldn't happen
yet:** mobile-viewport check on a real device, a deliberate DE/EN core-flow
repeat specifically against the current build (today's testing was mostly
German), and — the one this session structurally cannot do — live
automated smoke-testing against `tekmesis.com` from an agent session (the
sandbox's outbound network policy 403s on arbitrary hosts; confirmed
2026-07-31 trying to run `scripts/smoke-test.sh`). A future session with
real browser/network access should re-run this review's 25 items against
the live production site rather than trusting this snapshot.

## Commands run and results

| Command | Result |
|---|---|
| `npm run lint` | Pass, 0 errors/warnings |
| `npm run typecheck` | Pass, 0 errors |
| `npm run test` (unit, Vitest) | Pass — 215/215 tests, 44 files |
| `npm run test:integration` | Pass — 1/1 test |
| `npm run build` (Next.js production build) | Pass — 19 routes compiled |
| `npx playwright test` (e2e + `@a11y`) | Pass — 46/46 specs |
| `npm run verify` (lint+typecheck+test+integration+build) | Pass |
| `npm audit` / `npm audit --omit=dev` | **Could not run** — the registry's
  legacy `quick` audit endpoint returns `400 Bad Request` ("This endpoint is
  being retired. Use the bulk advisory endpoint instead"), independent of
  this project's dependency tree. Not a pass; genuinely unverified. |
| Manual live check: `curl` against a running `npm run start` for
  `GET /api/cron/expire-reports` with no/wrong `Authorization` header | Both
  return `401`, confirming the cron route fails closed when `CRON_SECRET` is
  unconfigured |

No P0 defect was found that required a code fix during this review — see
per-item findings below for what was checked and what remains open.

## Item-by-item verification

1. **Broad-domain positioning genuinely implemented.** `src/content/topics.ts`
   defines 12 categories spanning learning, work, relationships, consumer
   decisions, environment, technology — not health-only. Landing page copy
   (`src/app/page.tsx`, dictionaries) markets "evidence platform," not a
   health product. **Pass.**
2. **Topic taxonomy and examples work.** `/topics` renders all 12 categories
   with 4–8 example questions each in DE/EN; live-verified by
   `e2e/site.spec.ts`. **Pass.**
3. **Source routing appropriate by domain.** `src/lib/source-adapters/registry.ts`
   maps each of the 12 topic slugs to an explicit, ordered adapter list
   (`BIOMEDICAL_ROUTE`, `BROAD_ROUTE`, `BROAD_WITH_BIOMEDICAL_ENRICHMENT`) —
   this is a real routing table, not just descriptive UI text (`topics.ts`'s
   `sourceRoute` field is separately the human-readable copy). Unmapped slugs
   fall back to `BROAD_ROUTE` rather than throwing. **Pass.**
4. **Official/approved APIs used.** Adapters target OpenAlex, Crossref,
   Europe PMC, and NCBI E-utilities — all documented, terms-permitting public
   APIs (`src/lib/source-adapters/{openalex,crossref,europe-pmc,ncbi}.ts`).
   **Pass**, contingent on the still-open live-network validation in
   `OPEN_RISKS.md` #2 (this sandbox cannot reach any of the four hosts, so
   contract-conformance is unit-tested against hand-authored fixtures, not a
   live response).
5. **No Google Scholar scraping.** Grepped the full `src/` tree for
   `scholar` — the only hits are an unused `SEMANTIC_SCHOLAR_API_KEY` env var
   (defined, never referenced by any adapter or the registry) and copy that
   explicitly states scraping is not used. No scraping code exists anywhere.
   **Pass.**
6. **No paywall bypass.** Grepped for `bypass`/`sci-hub` — only hits are an
   unrelated code comment ("even if the event-ID guard were somehow
   bypassed") and the same "no paywall bypass" marketing copy. Adapters only
   ever request metadata/abstracts from open APIs, never full text.
   **Pass.**
7. **No source or result fabrication.** `src/lib/reports/premium-report.ts`
   builds every citation/study field from real adapter response data;
   AI-dependent fields (key findings, interpreted question, per-study
   outcome/effect estimate, synthesis) are explicitly `null`, never guessed —
   covered by a dedicated "never fabricates AI-dependent content" unit test.
   **Pass.**
8. **Visual-reference images not reused as evidence.** No image assets from
   the supplied visual references are rendered inside any evidence-bearing
   component (`StudyComparisonMatrix`, `StudyProfileCard`,
   `EvidenceLandscapeSection`, `SourceAppendix`) — those references were used
   only for layout/style during Phase 2, per `CLAUDE.md`. **Pass.**
9. **Domain/risk classification.** `src/lib/classification/domain.ts`
   (keyword-overlap scoring against the taxonomy) and
   `src/lib/classification/high-risk.ts` (independent detector, checked
   before domain classification, never bypassable by a confirmed domain) are
   both unit-tested and exercised live via Playwright (`a high-risk question
   is restricted, not classified`). **Pass**, with the known, documented
   limitation that this is rule-based, not AI (`OPEN_RISKS.md` #10) — some
   real-world phrasings will fall through to the manual topic picker rather
   than being classified correctly. Not a defect; a scoped tradeoff.
10. **Query clarification.** `QuestionClarification` component
    (confirm/edit/pick-alternative) — `e2e/search.spec.ts` exercises both the
    top-candidates and full-fallback-list paths live. **Pass.**
11. **Screening transparency.** `src/lib/search/screening.ts` produces
    explicit include/exclude decisions with reasons
    (`retracted`/`protocol_only`/`insufficient_detail`); `SourceAppendix`
    surfaces this. **Pass**, with the documented gap that only mechanically
    computable exclusion reasons are implemented (`OPEN_RISKS.md` #12) — full
    topical-fit screening needs AI.
12. **Eligibility gate.** `src/lib/eligibility/eligibility.ts` — configurable
    thresholds (not magic numbers), unit-tested against all threshold
    boundaries; unsupported questions are never sold (`not_eligible` blocks
    the paywall entirely). **Pass.**
13. **Free teaser.** `src/lib/eligibility/teaser.ts` builds a real,
    non-fabricated teaser from actual search results, with a confidence
    label. **Pass.**
14. **Premium Report depth and source traceability.** All 9 required
    sections are built (`buildPremiumReportData`); every included study links
    back to its real source record in the appendix. **Pass** for the
    structural/non-AI content; the AI-dependent narrative sections remain
    `null` pending `ANTHROPIC_API_KEY` (tracked, not hidden).
15. **Evidence-confidence language.** Teaser and report both surface an
    explicit confidence label derived from real coverage/study-count
    thresholds, never an invented certainty claim. **Pass.**
16. **Stripe signature and idempotency.** `src/lib/stripe/webhook.ts` verifies
    the raw-body signature via `stripe.webhooks.constructEvent` and enforces
    idempotency two independent ways: the event-ID guard
    (`webhookEventRepository.recordIfNew`) and a status guard (a report past
    `checkout_started` is never re-fulfilled even under a different event
    ID) — both covered by dedicated tests including a same-event-ID replay
    and a different-event-ID/same-session replay. **Pass**, contingent on
    live Stripe test-mode validation (`OPEN_RISKS.md` #13 — no Stripe account
    exists in this session).
17. **Report lifecycle and persistent access.** `src/lib/reports/lifecycle.ts`
    implements the full state machine including the new (Phase 10)
    `ready → expired` retention transition, enforced through a single
    `transitionReportStatus` choke point. **Partial / genuine gap:** there is
    still no page that reads a report back by its secure token
    (`ReportRepository.findByTokenHash` is defined and tested but never
    called from any route) — so "persistent access" via the secure link
    doesn't exist yet as a user-facing feature. This is not a new finding;
    it's the same gap already tracked as `OPEN_RISKS.md` #14/#16, restated
    here because item 17 explicitly asks about it. **Not a P0 for this
    review** (no live payments can occur yet either, so nothing is
    reachable that would need this page today), but it blocks Phase 11's
    "external non-technical test pass" and must be built before real
    traffic.
18. **Email.** `src/lib/email/` — report-ready/failed/refund-confirmation
    templates take no question/report-content parameter, so raw question
    text cannot structurally leak into an email. **Pass** for the code;
    unverified against a live Resend account (`OPEN_RISKS.md` #15).
19. **Admin and analytics.** `/admin`, `/admin/payments`, admin auth
    (HMAC-signed cookie, no server-side session store), `admin_audit_log` on
    every action; analytics allowlist + `sanitizeMetadata` strips
    non-allowlisted keys before any event is persisted or forwarded — a
    caller cannot leak raw question text even by mistake, verified by a
    dedicated test. **Pass**, with the deliberately deferred admin sections
    (feedback/issue-reports, source-health, cost/topic analytics) still
    absent and tracked (`OPEN_RISKS.md` #15).
20. **Privacy/retention/abuse controls.** No mandatory account, no health
    profile, explicit warning against entering names/private health data
    (`OwnQuestionForm`), `sanitizeMetadata` (no raw queries in analytics),
    hashed report tokens, HMAC-hashed rate-limit keys (raw IPs never
    stored), 12-month retention with an actual expiry job (Phase 10). **Pass**
    for everything code-level; the retention cron has never fired against a
    live schedule (`OPEN_RISKS.md` #16).
21. **Accessibility.** 46 Playwright specs include a `@a11y` axe scan
    (`wcag2a`, `wcag2aa`, `wcag22aa`) on every distinct page state — home,
    topics, all 6 content pages, all 6 `/search` states (including the two
    new Phase 10 states), admin (authenticated and login), example-report.
    All pass with zero violations, live-verified in a real Chromium browser,
    not just static analysis. **Pass**, with the caveat that this is
    automated coverage only — a manual screen-reader pass (part of doc 19's
    checklist) has not been done and needs a human.
22. **Performance/security.** Security: CSP with per-request nonce, HSTS,
    X-Frame-Options, Permissions-Policy (Phase 10), all live-verified.
    Performance: **not measured** — no Lighthouse/Web Vitals run exists yet;
    this needs a deployed environment (Vercel preview) to be meaningful
    rather than a local dev-mode number. Flagged as an open item for Phase
    11, not a P0 (nothing about the current architecture suggests a
    performance risk — mostly static content plus a handful of bounded,
    timeout-protected outbound calls per search).
23. **Hostpoint/Vercel domain and email separation.** No live deployment
    exists to verify this against. Architecturally, the app has zero
    dependency on domain-level tricks — no iframe, no reverse proxy, no
    `axia4.ch` embedding anywhere in `src/` (grepped) — `NEXT_PUBLIC_AXIA4_DIGITAL_URL`
    is only used as an outbound link target. **Cannot be fully verified
    without live DNS/Vercel/mail records**, which are explicit `CLAUDE.md`
    human-stop-conditions (DNS ownership) not attempted here.
24. **AXIA4 remains independent.** Confirmed no shared code, no embedded
    AXIA4 branding beyond the documented "Ein Produkt von AXIA4 Digital"
    attribution line, no iframe/proxy. TEKMESIS runs as its own product on
    its own domain per `CLAUDE.md`'s Identity section. **Pass.**
25. **Production smoke tests.** Not run — there is no production deployment.
    A smoke-test checklist/script is being prepared separately (see
    `docs/SMOKE_TESTS.md`) so it's ready to execute the moment a real
    deployment exists.

## Defects found

None requiring a code fix in this review pass. The findings above are all
either (a) already-tracked, already-documented gaps that reflect genuine
scope decisions (AI features, live-credential validation), not oversights,
or (b) items that structurally cannot be verified without infrastructure
this session doesn't have (live DNS, live Stripe, a deployed environment).

## Fixes applied

None needed.

## Remaining risks

See `docs/OPEN_RISKS.md` for the full, numbered list (16 items as of Phase
10). The ones most relevant to this review's GO/NO-GO call:

- #2: source adapters never run against live APIs (sandbox network policy).
- #6: rate limiting code-complete but the Supabase-backed limiter (needed in
  serverless production) never run live.
- #13: Supabase migration and Stripe checkout/webhook code never touched a
  real system.
- #14: the live UI still can't sell anything — no working buy button, no
  report row created on teaser render.
- #16: retention cron never fired live; no secure-link report viewer exists
  yet, so item 17 above ("persistent access") is genuinely incomplete.
- #1: Treuhänder VAT confirmation outstanding — blocks live Stripe mode.

## Source-coverage assessment

Routing (item 3) is real and topic-appropriate. Actual coverage quality
(precision/recall of results per topic) cannot be assessed without live API
access — `SOURCE_COVERAGE_MATRIX.md`'s per-category expectations (stronger
biomedical/education coverage, weaker consumer/environment/relationships
coverage) are architectural predictions, not yet measured against real
result sets.

## Evidence-safety assessment

Strong: the null-for-unknown-AI-fields architecture makes fabrication
structurally difficult rather than relying on prompt discipline alone (there
is no AI call in the current build at all — `AI_EXTRACTION_ENABLED` defaults
to `false`). Screening, eligibility, and confidence-labeling are all
computed from real data with documented, tested boundaries. The one caveat:
none of this has been checked against real search results yet, only
fixtures — so "no fabrication" is verified for the code paths that exist,
not yet stress-tested against real-world messy data.

## Payment assessment

Signature verification and idempotency are solid and well-tested (item 16).
Blocking gap: no live Stripe account, and no UI path actually initiates a
checkout yet (`PaywallPanel`'s buy button isn't wired — `OPEN_RISKS.md` #14).
Payment code is trustworthy; payment *flow* is incomplete.

## Privacy/security assessment

Meets every `CLAUDE.md` privacy rule at the code level (item 20). CSP/
security headers are live-verified. `npm audit` could not be run due to an
external registry-endpoint deprecation, not a project issue — this should be
retried with a current npm/registry combination before production.

## Accessibility assessment

Automated coverage is thorough and passing (item 21). A manual pass
(keyboard-only navigation, screen reader) has not been done and is a
reasonable Phase 11 task once there's a stable preview URL to test against.

## Deployment assessment

Nothing has been deployed. `vercel.json` (Phase 10) declares the cron
schedule; no Vercel project, environment variables, or DNS records exist
yet. This is expected at this stage — Phase 11/12 explicitly own
provisioning that, and several of those steps are `CLAUDE.md` human-stop
conditions (DNS ownership, Stripe live-mode activation) that require Erwin's
direct action, not something to attempt from this session.

## Final GO/NO-GO

**NO-GO for production**, as expected at this stage of the plan. No P0
code-level defect was found — the code that exists is sound and tested. The
blockers are entirely about missing live infrastructure and credentials
(Supabase, Stripe, DNS, a deployed environment, `ANTHROPIC_API_KEY`) and one
still-missing feature (the secure-link report viewer), all already tracked
in `OPEN_RISKS.md`. This review should be re-run once Phase 11's live
Vercel/Stripe-test-mode environment exists, when items 2, 3 (live
confirmation), 16, 17, 22, 23, and 25 above can actually be exercised rather
than assessed from static code.

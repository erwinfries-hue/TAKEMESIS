# Open Risks

Tracked risks after concept-review completion. Reviewed again at the beta
checkpoint (decision #15) and before each production-readiness gate.

## Blocking (must resolve before live Stripe / real payments)

1. **EU cross-border VAT/OSS treatment undetermined.** AXIA4 GROUP (Einzelunternehmen
   Erwin Fries) is not yet Swiss-MWST-registered and hasn't clarified DACH
   cross-border digital-services VAT obligations with a Treuhänder. Blocks: Stripe
   live mode, real payments from DE/AT customers, final `/legal` tax wording.
   Owner: Erwin, with Treuhänder. Interim mitigation: decision #12's neutral wording,
   test-mode Stripe only until resolved.

## Blocking (must resolve before Phase 4 is signed off as production-ready)

2. **Source adapters (OpenAlex, Crossref, Europe PMC, NCBI E-utilities) have
   never been run against the live APIs.** The coding sandbox used to build them
   (2026-07-25) has an egress policy that returns a 403 policy denial for all four
   hosts, confirmed via the proxy status endpoint — no workaround attempted, per
   that policy's own instructions. The adapters were built against each API's
   documented response contract and unit-tested against hand-authored fixtures
   (`src/lib/source-adapters/fixtures/`, see that folder's `README.md`), not
   recorded live responses. **Update (Phase 6):** the all-sources-unreachable
   resilience path was confirmed live in this same sandbox — `/search` with a
   confirmed domain correctly renders `SearchFailedNotice` rather than a
   fabricated result, since all 4 adapters genuinely fail here. **Still open
   before Phase 4/5 are considered fully validated:** run each adapter's
   `search()` against the real API from an environment with normal network
   access (locally, or a Vercel preview) and confirm the actual response shape
   (and a real success-path teaser render) matches what the fixtures assume.
   Owner: Erwin or next session with network access.

## Blocking (must resolve before Phase 7 is signed off as production-ready)

13. **Supabase migration and Stripe checkout/webhook code have never touched a
    real system.** No Supabase project and no Stripe account are provisioned
    in this session — Erwin explicitly chose (2026-07-25) to have this code
    built against documented contracts and unit-tested with in-memory
    repositories / a mocked Stripe SDK rather than wait for real test
    credentials first, same tradeoff as the Phase 4 adapters. **Before
    trusting Phase 7 in production:** run `supabase/migrations/
    20260725220000_init_core_schema.sql` against a real Supabase project,
    swap the in-memory repositories for the Supabase ones in a real request
    path, and complete a full Stripe test-mode checkout (success, cancellation,
    bad signature, duplicate webhook delivery — the full test list in
    `00_START_HERE_ERWIN.md` §9). Owner: Erwin or next session with
    credentials.
14. **The live UI still can't sell anything.** `PaywallPanel` on `/search` has
    no working "buy" button, and no `reports` row is created when a teaser is
    shown — Phase 7 built the checkout/webhook/lifecycle *library*, not the
    end-to-end wiring, because that wiring is only meaningfully testable once
    #13's real credentials exist. First task once they do: create a report
    record (`draft` → `preview_ready`) when a teaser renders, wire the buy
    button to `createCheckoutSession`, and swap the in-memory repositories
    for the Supabase ones everywhere.

## Non-blocking, monitor through beta

4. **Single-founder operational load.** Refunds, corrections, deletions, and safety
   escalations all route to one person. Mitigated by: 3–5 business day response
   commitment (decision #10), 15-person beta size (decision #15), admin dashboard
   surfacing safety issues distinctly. Revisit if beta volume exceeds sustainable
   response time.
5. **Weaker source coverage in non-biomedical, non-education categories.** Konsum &
   Kaufentscheidungen, Umwelt/Nachhaltigkeit, Beziehungen & Kommunikation are
   expected to produce more `eligible_with_limitations`/`not_eligible` outcomes
   (see `SOURCE_COVERAGE_MATRIX.md`). Monitor eligible-rate by category at the beta
   checkpoint; consider narrowing active categories if a specific one consistently
   fails to produce sellable reports.
6. **AI + free-teaser cost exposure.** **Update (Phase 10):** the 5/day/IP
   free-search limit (decision #7) is now enforced — `src/lib/security/`
   HMAC-hashes the client IP (`RATE_LIMIT_SECRET`, never stores it raw),
   checked in `/search` right before `runSearch()` runs; fail-open (allows
   the search) whenever `RATE_LIMIT_SECRET` is unset, so this is inert until
   deliberately turned on. In-memory limiter is correct for a single
   long-lived process only; `SupabaseRateLimiter` (used automatically once
   `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are set) is the
   serverless-correct implementation but, like the rest of the Supabase
   integration, has never run against a real database (see #13). Actual AI
   spend should also be tracked from day one against the CHF 1.00–1.50/report
   estimate (decision #9) to confirm it holds at real usage volumes.
7. **NCBI E-utilities rate limits without an API key.** 3 req/sec cap is fine at
   beta volume; revisit (add `NCBI_API_KEY`) if search volume grows.
8. **Admin auth is minimal (email allowlist + shared secret).** Acceptable for a
   single-operator closed beta; revisit (e.g. add MFA) before public MVP once real
   payment data volume increases.
9. **Report-link sharing (decision #6) means the link is the only access control.**
   Mitigated by visible warning + self-revoke, but a leaked link (e.g. posted
   publicly) remains viewable until revoked. No additional MVP mitigation planned;
   monitor via admin revocation tooling.
10. **Domain classification is rule-based, not AI.** The Phase 3 classifier scores
    keyword overlap against the taxonomy's own text — it will misclassify or fail
    to classify some real-world phrasings that an AI-based interpreter would
    handle. Acceptable for beta (falls back to a manual 12-topic picker rather
    than guessing), but should be revisited once `ANTHROPIC_API_KEY` is
    provisioned and AI-based query interpretation is built.
11. **NCBI adapter has no abstract text.** `esummary` doesn't return abstracts;
    every NCBI-sourced record is `metadata_only`. Fetching abstracts would need an
    additional `efetch` call with XML parsing — deliberately deferred (P1) rather
    than half-built. Europe PMC and OpenAlex cover abstract-level biomedical/broad
    content in the meantime.
12. **Screening only excludes what's mechanically computable.** `retracted`,
    `protocol_only`, and `insufficient_detail` are implemented; the doc's other
    exclusion reasons (wrong topic, wrong population/context, non-comparable
    intervention, insufficient result detail beyond a missing title, unsupported
    language/content) need real content understanding — not built until AI-based
    interpretation exists. Until then, some studies that a human screener would
    exclude will pass through to ranking/eligibility; the eligibility engine
    (Phase 6) must not assume screening has already filtered for topical fit.
15. **Phase 9's admin/email/analytics scope was deliberately narrowed.** Built:
    email templates+send (Resend), the funnel-event allowlist + tracking
    (PostHog), admin auth, and an admin dashboard covering report status/
    actions + payments. **Not built** (see `STATUS.md` for why each was
    deferred rather than shipped as an empty shell): feedback/issue-report
    repositories and admin pages, source-health persistence (Phase 4's
    `checkAllSourceStatuses` still isn't written anywhere), cost-estimate and
    topic/source-coverage analytics views. None of email sending or PostHog
    forwarding has been verified against a live account (`EMAIL_API_KEY` /
    PostHog site ID are both unset) — same live-validation gap as the source
    adapters and Stripe/Supabase, tracked here rather than assumed working.
    **Update (marketing differentiation pass):** discovered that `track()`
    itself had never been called from any route despite being fully built —
    the funnel-event pipeline was completely disconnected. `track()` is now
    resilient to a failing repository (see #17), and `domain_classified` is
    wired in `/search`. The other ~25 events in the allowlist
    (`question_submitted`, `paywall_viewed`, `checkout_completed`,
    `report_ready`, etc.) are still not called anywhere — wiring them is
    real, separate work for whenever the admin funnel dashboards from this
    item are actually built (no value in tracking events nothing reads yet).

16. **Report retention/expiry job (decision #5) is built but never triggered
    live, and there's still no page that reads it back.** `src/lib/reports/
    expire-reports.ts` (12-month expiry, `REPORT_RETENTION_MONTHS`) is wired
    to `GET /api/cron/expire-reports`, scheduled daily via `vercel.json`
    (`0 3 * * *`), and gated on `CRON_SECRET` (`Authorization: Bearer
    <CRON_SECRET>` — unset means the route always 401s, live-verified in
    this sandbox). **Not done:** `CRON_SECRET` isn't provisioned anywhere, so
    the schedule can't actually fire yet in production; and there is still no
    secure-link report-viewer page (`/report/[token]` or similar) — Phase 7/8
    built the checkout/lifecycle/report-rendering *pieces*, but nothing in the
    app currently reads a report by token and shows/blocks it based on
    status, so an expired report has no user-visible effect yet (only visible
    in `/admin`). This viewer is the same "live UI can't sell anything" gap
    as #14, extended to the post-purchase side. Owner: Erwin or next session
    with a deployed Vercel project (to provision `CRON_SECRET` and confirm
    the cron actually fires).

17. **Marketing differentiation pass: two small live-validation gaps.**
    (a) No Open Graph image — `layout.tsx` now sends `og:title`/
    `og:description` but no `og:image`, since no branded 1200×630 asset
    exists anywhere in this repo (`public/` is empty); a shared link will
    render as a text-only card until one is designed and added. (b) The
    `/topics` social-proof counter (`getAskedCountForDomain`,
    `SOCIAL_PROOF_MIN_COUNT = 5`) is code-complete and unit-tested but has
    never run against a real Supabase project — same live-validation gap as
    everything else Supabase-backed (#13). It fails safe (renders nothing)
    when unreachable, confirmed live in this sandbox, so this is a
    "not yet verified," not a "known broken."

## Not risks, but explicit go/no-go gates already defined

- Beta continue/optimize/pause/stop thresholds: decision #15.
- Independent final review (`18`) must reach GO before production, per its own
  P0-defect-blocking rule.

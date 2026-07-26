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
   fabricated result, since all 4 adapters genuinely fail here. **Update
   (live-network validation pass):** the real gap this item was tracking is now
   partially closed — Erwin deployed a real Vercel project
   (`erwinfries-hue/TAKEMESIS`, branch `claude/takemesis-mvp-app-f622xx`) and
   ran two real questions against the live APIs. The success path does work
   (real results came back from real sources), but it surfaced a genuine bug:
   irrelevant records (wrong topic entirely) were passing screening because the
   already-computed relevance score was only used for ranking, never exclusion.
   Fixed, in two rounds — see `STATUS.md`'s "Live-network validation pass"
   entry: round 1 added stopword filtering (`relevance.ts`) and a
   `MIN_RELEVANCE_SCORE = 0.4` exclusion threshold (`screening.ts`); a
   second live re-test the same day found round 1 incomplete for very short
   questions (2 meaningful terms), so round 2 added `meetsRelevanceThreshold()`,
   which requires *all* terms to match when a question has only 1-2
   meaningful terms rather than the plain 0.4 fraction. This is reasoned and
   numerically checked against all three real off-topic records encountered
   across both live rounds, but **not exhaustively tuned** — revisit once
   more real questions/traffic are observed, in case it's too strict (a
   genuinely relevant record using a synonym for one of only 2 terms would
   now be excluded) or still too loose for phrasings not yet seen. **Still
   open:** one of the two live
   runs showed an "OpenAlex nicht erreichbar" notice; Erwin was asked to check
   Vercel's Runtime Logs for the OpenAlex-specific error line to determine
   whether this is a genuine OpenAlex outage or a fixable timeout/serverless-
   duration-limit mismatch (Vercel Hobby's default function timeout vs. the
   adapter's own retry/timeout budget), but hasn't done so yet. Also
   unconfirmed: whether the orphaned `takemesis-preview` Vercel project
   (created by an initial clone-flow misstep before the real import) was ever
   deleted — cosmetic, not a functional risk. Owner: Erwin or next session
   with access to the live Vercel logs.

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
    actions + payments. **Update (2026-07-26): feedback/issue-report
    repositories and admin pages are now built** — `FeedbackRepository`/
    `IssueReportRepository` (in-memory + Supabase implementations),
    `resolveIssue`/`dismissIssue` admin actions with audit logging, and a new
    `/admin/feedback` page (linked from `/admin`) listing both tables and
    letting an admin resolve/dismiss open issues. Like the rest of the admin
    dashboard, it degrades gracefully (visible warning banner, no crash) when
    Supabase isn't configured — live-verified via a new Playwright spec.
    Still **not built**: nothing yet *writes* to these tables from public
    pages (no feedback-submission or issue-report UI exists outside the demo/
    admin surfaces), source-health persistence (Phase 4's
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

17. **Marketing differentiation pass: three small live-validation gaps.**
    (a) **Resolved (2026-07-26):** a branded Open Graph image now exists —
    `src/app/opengraph-image.tsx` uses Next's built-in `ImageResponse`
    (Satori) to render a 1200×630 PNG (shield mark, wordmark, tagline, on
    the brand navy background) with no external image-generation tool or
    static asset needed; `src/app/icon.svg` replaces the default Next.js
    starter favicon with the same shield mark. Live-verified: fetched both
    at runtime and confirmed a real 1200×630 PNG / valid SVG. Twitter card
    type upgraded to `summary_large_image` to match. (b) The
    `/topics` social-proof counter (`getAskedCountForDomain`,
    `SOCIAL_PROOF_MIN_COUNT = 5`) and (c) the "most-asked topics this week"
    ranking (`getTrendingTopics`, `TRENDING_MIN_COUNT = 3`) are both
    code-complete and unit-tested but have never run against a real Supabase
    project or real traffic — same live-validation gap as everything else
    Supabase-backed (#13). Both fail safe (render nothing) when unreachable,
    confirmed live in this sandbox, so this is "not yet verified," not
    "known broken" — and both will start showing real data on their own
    once real beta traffic crosses their thresholds, no further code needed.

18. **The paid product's core value doesn't exist yet — this is the actual
    gap behind every "market acceptance" concern, not a UI issue.** Per the
    market-acceptance review discussed with Erwin: `PremiumReportData`'s
    `keyFindings`, `synthesisAvailable`, and `practicalInterpretationAvailable`
    are structurally `null`/`false` until `ANTHROPIC_API_KEY` exists and
    AI-based extraction/synthesis is built (tracked since Phase 3/8, see the
    "Not started" section of `STATUS.md`) — today's report is real
    citations/screening/stats plus an honest "not yet available" where the
    actual answer should be. All the differentiation/WOW work in this and
    the prior pass (comparison table, confidence gauge, live demo, editorial
    print) is legitimate and worth having, but none of it substitutes for
    this. Should be the next priority once Erwin decides how to proceed —
    needs the API key (a `CLAUDE.md` human-stop-condition secret; see
    `docs/ANTHROPIC_API_KEY_ANLEITUNG.md` for the non-technical step-by-step
    account/key setup Erwin can do himself — the actual AI-wiring code is
    separate follow-up engineering work, not covered by that guide) and a
    product decision on scope/cost per report (decision #9's CHF 1.00–1.50
    estimate). **Update (2026-07-26):** Erwin explicitly chose cost-
    minimization over model capability for this task — `AI_MODEL` now
    defaults to the cheapest current Claude model
    (`claude-haiku-4-5-20251001`, `src/lib/env/schema.ts`), which should
    bring real per-report cost well under the original CHF 1.00–1.50
    estimate at beta scale. This is a default the eventual AI-wiring code
    should read from config, not hardcode, so it stays a one-line change
    to upgrade later if quality at beta volume warrants it.
    **Update (2026-07-26): the AI-wiring code now exists**
    (`src/lib/ai/`: extraction, synthesis, and an enrichment glue step —
    see `STATUS.md`'s "First real AI wiring" entry), scoped exactly to
    Erwin's chosen "Option A": wired into `/example-report`'s cached
    fictional demo and a new admin-only `/admin/report-preview` against
    real search results, deliberately **not** into the public `/search`
    flow or a persisted report yet. What's still open: (a) real quality
    judgment — no session with a live `ANTHROPIC_API_KEY` has actually run
    this against genuine evidence yet, so whether Haiku-tier extraction is
    good enough is still unverified (use `/admin/report-preview` once the
    key exists); (b) the persisted-report flow itself (`OPEN_RISKS.md`
    #14) is unchanged and still needed before AI synthesis can be part of
    the real paid product, not just a preview tool.
    **Update (2026-07-26): hardened against malformed model output.** A
    bug-hunt pass found that `study-extraction.ts`/`report-synthesis.ts`
    trusted the Anthropic tool-use response with an unchecked `as` cast —
    forced `tool_choice` makes a schema-conforming reply likely but not
    guaranteed, and a wrong-shaped reply (e.g. `keyFindings` as a string
    instead of an array) would have bypassed `report-enrichment.ts`'s
    try/catch (it doesn't throw, just returns bad data) and crashed
    `PremiumReportView` at render time (`report.keyFindings.map(...)`).
    Both modules now validate the tool response with a Zod schema and
    return `null` (the existing "AI unavailable" fallback) on a mismatch,
    with new unit tests covering a malformed response for each. No live
    key exists in this sandbox to confirm real-world response shapes, but
    the failure mode is now a safe no-op instead of a page crash either way.

19. **`topics.ts`'s example questions have never been checked against real
    evidence coverage.** They were written during Phase 2 for topical
    illustration, before this project had any live network access — a live
    test (2026-07-26) showed a Gesundheit & Prävention example
    ("Welche Massnahmen senken das Risiko häufiger Rückenschmerzen?")
    reliably comes back `not_eligible`. Per the Broad-domain rule
    (`CLAUDE.md`: "tested for researchability... tested for evidence
    sufficiency," "unsupported questions must not be sold"), an example that
    can't itself pass eligibility is a real content gap. A diagnostic tool
    now exists to check this properly instead of guessing —
    `/admin/example-questions` (see `STATUS.md`) runs every example question
    of a chosen topic through the real search+eligibility pipeline and shows
    per-question results. **Not done yet:** actually running it against all
    12 topics on the live Vercel deployment and curating `topics.ts` based on
    the real results — replacement questions must themselves be checked
    before being added, not invented. Owner: Erwin (run the tool on
    `takemesis.vercel.app`, report back which examples fail per topic).

20. **AXIA4 is represented as a text link, not the official logo image.**
    Erwin explicitly decided (2026-07-26) against embedding
    `docs/assets/brand/AXIA4_OFFICIAL_LOGO_REFERENCE.png` (a non-transparent
    baseline JPEG) on-site at all — superseding the brief earlier attempt to
    wrap it in a white badge. Footer and `/about` now show plain text
    "AXIA4 GROUP" linking to `https://axia4.ch`, matching the legal-entity
    name already used on `/legal` ("AXIA4 GROUP, Einzelunternehmen von Erwin
    Fries"). `src/components/brand/axia4-logo.tsx` and the copied asset were
    removed as unused. Revisit only if Erwin later wants a real logo
    treatment (would need a transparent PNG/SVG requested directly from
    AXIA4). Not blocking anything.
21. **`NEXT_PUBLIC_AXIA4_DIGITAL_URL` on the live Vercel deployment points
    at `axia4.lovable.app/digital` without a locale segment.** Not a repo
    issue — the codebase's own default is `https://axia4.ch/digital` (the
    real domain per `CLAUDE.md`); Erwin set the Vercel env var to the
    interim Lovable-hosted URL since `axia4.ch` DNS isn't live yet (see
    risk #2 in `16_DEPLOYMENT_TEKMESIS_DOMAIN_AND_AXIA4.md`'s "AXIA4 remains
    at Lovable"). Needs a `/de/` segment (`axia4.lovable.app/de/digital`).
    This session has no Vercel dashboard access — one exact action for
    Erwin: Vercel project → Settings → Environment Variables →
    `NEXT_PUBLIC_AXIA4_DIGITAL_URL` → update value → redeploy.

22. **A country-of-study search filter was requested (Erwin) and
    deliberately not built.** Publication-age and study-type filters were
    built (`src/lib/search/filters.ts`) since `NormalizedRecord.year` and
    `.publicationType` are already populated for every record from all
    four source adapters. Country is different: none of the four adapters
    (OpenAlex, Crossref, Europe PMC, NCBI) currently extract a country
    field, and the only field that could approximate it — OpenAlex's
    author-institution `country_code` (present in the raw API response,
    not currently mapped) — reflects where the *researchers* are
    affiliated, not where the study *population* was drawn from, and
    would only work for one of the four sources. Offering a country filter
    on that basis would either quietly narrow results to a small,
    non-representative slice or misrepresent what's actually being
    filtered — both cross `CLAUDE.md`'s "never invent source coverage"
    rule. Revisit only if a source with genuine per-study population
    country data is added, or if institution-affiliation filtering is
    explicitly relabeled as such (not "country of study") and scoped to
    OpenAlex-only with a visible coverage caveat.

23. **The "compare a study you already have" DOI lookup has never
    resolved a real DOI live.** Same live-network-validation gap as the
    four search adapters (`OPEN_RISKS.md` #2) — this sandbox has no
    outbound network access to Crossref's API at all, so
    `lookupByDoi()`'s success path (`src/lib/source-adapters/crossref.ts`)
    is only verified via mocked-fetch unit tests, never against a real
    response shape. Both honest failure states (invalid DOI, lookup
    failed) were live-verified in the UI since they don't depend on
    network access. Scoped to Crossref only for v1, not also
    OpenAlex/Europe PMC/NCBI — see `STATUS.md`'s "Compare a study you
    already have" entry for the reasoning. Owner: whoever first runs this
    from an environment with real network access — try a known-good DOI
    (e.g. a real published paper) end to end through `/search?doi=...` and
    confirm the resolved title, the `SeedStudyPanel` render, and that the
    comparison results correctly exclude the seed study.

24. **Two e2e tests fail in this sandbox against `npm run build && npm run
    start`, unrelated to any code change — confirmed pre-existing by
    stashing all working changes and re-running against the untouched
    baseline commit.** `e2e/search.spec.ts`'s rate-limit test exhausts
    `FREE_SEARCH_LIMIT` (5 requests) then expects a 6th to be blocked, but
    the block never happens — `checkFreeSearchLimit` falls back to
    `InMemoryRateLimiter` (module-level singleton) since Supabase isn't
    configured, which should persist counts across requests within one
    process; the counts apparently don't accumulate as expected under
    this sandbox's `next start` process model. `e2e/security-headers.spec.ts`
    intermittently fails the same way (missing CSP header on one run,
    console errors from Supabase-not-configured trending-topics fetches on
    another) — likely a related or adjacent flake in the same built/started
    server. Not investigated further here since it's orthogonal to the
    UI/UX audit pass that surfaced it and reproduces identically without
    any of that pass's changes. Owner: whoever next touches
    `src/lib/security/in-memory-rate-limiter.ts` or the e2e `webServer`
    setup — reproduce with `npm run test:e2e -- --grep "rate-limit"` and
    check whether `next start` (Turbopack) runs request handling across
    more than one process/worker, which would explain why a module-level
    singleton doesn't see all requests.

## Not risks, but explicit go/no-go gates already defined

- Beta continue/optimize/pause/stop thresholds: decision #15.
- Independent final review (`18`) must reach GO before production, per its own
  P0-defect-blocking rule.

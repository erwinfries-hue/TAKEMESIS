# Open Risks

Tracked risks after concept-review completion. Reviewed again at the beta
checkpoint (decision #15) and before each production-readiness gate.

## Blocking (must resolve before live Stripe / real payments)

1. **RESOLVED 2026-07-28.** EU cross-border VAT/OSS treatment was undetermined;
   Erwin's Treuhänder has now answered all questions from
   `docs/TREUHAENDER_FRAGEN.md` (full answers preserved in the uploaded, filled-in
   docx). Outcome: Erwin Fries operates TEKMESIS as a private individual, not
   as "AXIA4 GROUP" (AXIA4 is an umbrella brand only) — `/legal` and the price
   note were updated accordingly (decisions #11/#12/#16/#17 in
   `FINAL_CONCEPT_DECISIONS.md`). Confirmed not Swiss-MWST-liable (under CHF
   100'000). No EU OSS registration at launch — deliberate Treuhänder call,
   mitigated by activating **Stripe Tax** from day one (still to do as an
   account action once Stripe live credentials exist — not code). Remaining
   before Stripe can go live: real Stripe account/credentials (unrelated to
   this VAT question) and the EU withdrawal-right waiver checkbox at checkout
   (new item, see #14 below — the checkout UI itself doesn't exist yet
   either way).

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
   now be excluded) or still too loose for phrasings not yet seen. **Update
   (2026-07-28), the predicted "too strict" failure mode actually
   materialized:** live-tested via a new debug panel on
   `/admin/report-preview` (shows the translated query + `excludedByReason`
   counts — the premium report itself has no exclusion breakdown anywhere,
   which made this otherwise undiagnosable from a screenshot alone), the
   exact canonical example from this file's own code comments — "Hilft
   Kreatin beim Muskelaufbau?" — came back **23 found, 0 included, all 23
   `not_relevant`**. Root cause is upstream of `meetsRelevanceThreshold`
   itself: `query-translation.ts`'s own `STOPWORDS_DE` list is smaller than
   and independent from `relevance.ts`'s `STOPWORDS` — "hilft" and "beim"
   aren't in `STOPWORDS_DE`, so `buildSearchQuery` leaves them untranslated
   in the query sent to `meetsRelevanceThreshold` as
   `"hilft creatine beim muscle growth"`. Both words happen to *also* be in
   `relevance.ts`'s own `STOPWORDS` and get filtered back out there, so the
   final `queryTerms` is `{"creatine", "muscle", "growth"}` (3 terms, the
   ≥0.4-fraction rule, not the 2-term all-must-match rule) — meaning a real
   record needs "creatine" plus at least one of "muscle"/"growth" literally
   in its title+abstract. Real creatine-research titles commonly say
   "strength", "performance", "resistance training", "body composition", or
   "hypertrophy" instead — genuinely relevant records with none of exactly
   "muscle" or "growth" in the title (and no abstract at all for
   NCBI-sourced records, `OPEN_RISKS.md` #11) fail this. Not fixed here —
   needs actual investigation with real title/abstract text, not a blind
   threshold tweak, and ideally the debug panel extended to show excluded
   record titles (currently only aggregate counts), not just a guess under
   time pressure. **Update (2026-07-28, fixed): root cause was two
   independently-drifted stopword lists** — `query-translation.ts` had its
   own smaller list than `relevance.ts`'s, so connector words like "hilft"/
   "beim" passed through untranslated into the sent query, then got
   silently dropped during *screening* by `relevance.ts`'s different list —
   shifting the meaningful-term count and picking a stricter matching rule
   than intended. Fixed by exporting `relevance.ts`'s `STOPWORDS` and
   merging it into both of `query-translation.ts`'s locale-specific lists,
   plus closing the two dictionary gaps below. **Re-verified live
   (2026-07-28): the stopword/dictionary fix worked** — the sent query was
   clean ("creatine muscle growth", no leftover noise words) — **but the
   live re-test still showed 0/30 included, revealing a second, deeper bug**
   one layer below the one this fix addressed. Added `SearchRunResult.
   excludedSample` (`run-search.ts`, capped at 15) to `/admin/report-preview`'s
   debug panel to see actual excluded titles instead of guessing further —
   this showed all 12 of the sampled `ncbi_pubmed` titles were genuinely
   unrelated to creatine at all (heart failure, Chinese herbal cardiac
   studies, meat tenderness in rabbits — none mentioning "creatine").
   Hypothesized PubMed's Automatic Term Mapping was treating a bare
   space-separated `term` loosely and added explicit `AND` between terms
   (`buildPubmedTerm()`) to force a strict intersection. **Re-tested live a
   third time (2026-07-28) — the explicit-AND change had zero effect: the
   exact same 30 records, same order, came back.** Retracting that as the
   fix; PubMed's ATM already implicitly ANDs bare space-separated terms
   (standard, long-documented PubMed search-box behavior), so the change,
   while harmless and arguably more explicit, was not the actual cause.
   Left in place since it's a no-op-or-better, not reverted. **Real
   hypothesis now, added to the debug panel to test it directly:** NCBI's
   `esearch` matches against the *full* server-side indexed record
   (abstract, MeSH terms, substance names — e.g. "creatine kinase," a
   completely different concept from creatine supplementation, is a classic
   biomarker mentioned across huge numbers of unrelated cardiac/muscle-
   damage papers), but `esummary` — what `ncbi.ts` actually reads back —
   never returns abstract text (`OPEN_RISKS.md` #11, `dataCompleteness:
   "metadata_only"` for every NCBI record). So NCBI can "find" a record via
   its abstract, but our own relevance screening can only ever see that
   record's *title*, and correctly excludes it when the title alone doesn't
   establish relevance — arguably correct, safe, conservative behavior
   given the evidence-integrity rules, not a bug in the exclusion logic
   itself. Added `excludedSample[].hasAbstract` and a `perSource` count
   breakdown to the debug panel to actually confirm this (do all-excluded-
   NCBI-samples show `hasAbstract: false`? did Europe PMC/OpenAlex — which
   do carry abstracts — return anything at all for this query, and if so
   was it included or also excluded?) before deciding on a real fix (most
   likely candidates: build the deferred NCBI `efetch` abstract call from
   #11, or route biomedical topics away from title-only NCBI results when
   Europe PMC's overlapping PubMed-derived coverage can serve the same
   records with abstracts). **RESOLVED (2026-07-28) — re-tested live a
   fourth time with the fuller debug panel and the "0 included" framing
   turned out to be a diagnostic gap, not the current real state: 60 raw
   hits, 3 merged as duplicates, 30 correctly excluded as `not_relevant`
   (Europe PMC results with generic/tangential titles — e.g. rabbit-meat-
   tenderness and poultry-feed studies that happen to also discuss
   "guanidinoacetic acid," creatine's metabolic precursor), and
   **27 genuinely included** — the report rendered real, substantive,
   appropriately-hedged AI-synthesized findings ("Kreatin ist am
   wirksamsten für Muskelwachstum bei jungen, gesunden Menschen mit
   ausreichendem Krafttraining," correctly flagging limited evidence in
   older populations and non-human-to-human caveats), not the "Noch nicht
   verfügbar" placeholder. This is the first live confirmation that both
   the search/relevance pipeline and the AI extraction/synthesis pipeline
   (`OPEN_RISKS.md` #18) work end-to-end together, for a real question,
   with `AI_EXTRACTION_ENABLED`/`ANTHROPIC_API_KEY` genuinely active in
   Vercel Production. Since `generate-report-content.ts` (the real paid-
   checkout path) calls the exact same `enrichPremiumReportWithAi()`, this
   is now confirmed live for actual paid reports too, not just the admin
   preview tool. The stopword-sync + dictionary-gap fixes earlier in this
   entry were real and worth keeping; the NCBI explicit-`AND` change turned
   out to be a no-op (see above) but is harmless. No further action needed
   here — the temporary debug panel additions to `/admin/report-preview`
   (query/exclusion-reason/per-source/dedup-provenance diagnostics) can
   stay as a permanent troubleshooting tool or be trimmed later; neither is
   urgent.
   **Second live case confirmed this
   was systemic, not one unlucky example, before the fix:** "Welche Wirkung hat regelmässiger
   Ausdauersport auf das Herz-Kreislauf-System bei Erwachsenen?" → 6 found,
   0 included, all `not_relevant`. Translated query:
   `"effect regelmässiger ausdauersport herz kreislauf system adults"` —
   "herz" and "kreislauf" (two of the most common German medical terms,
   arguably core vocabulary for a health-focused product) aren't in
   `DE_EN_DICTIONARY` at all, and "ausdauersport" isn't either even though
   "ausdauer" alone is — German's heavy compounding means a flat
   token-lookup dictionary structurally can't cover compound words via their
   parts. This is a bigger issue than adding missing entries one at a time:
   the dictionary approach itself has a ceiling for German medical/compound
   vocabulary. Worth considering for the next session: either a much larger
   sustained effort filling the dictionary, a lightweight compound-word
   splitter (match known component words when the whole compound isn't
   found), or revisiting whether this whole translation step should become
   an AI call now that `ANTHROPIC_API_KEY` exists — the tradeoff (cost,
   latency, an extra failure mode to handle safely) needs a real decision,
   not a default.
   **Still open:** one of the two live
   runs showed an "OpenAlex nicht erreichbar" notice; Erwin was asked to check
   Vercel's Runtime Logs for the OpenAlex-specific error line to determine
   whether this is a genuine OpenAlex outage or a fixable timeout/serverless-
   duration-limit mismatch (Vercel Hobby's default function timeout vs. the
   adapter's own retry/timeout budget), but hasn't done so yet. Also
   unconfirmed: whether the orphaned `takemesis-preview` Vercel project
   (created by an initial clone-flow misstep before the real import) was ever
   deleted — cosmetic, not a functional risk. Owner: Erwin or next session
   with access to the live Vercel logs. **Update (2026-07-28): a 5th adapter,
   arXiv, was added** (routed into "Technologie & Digital Life" alongside
   OpenAlex/Crossref — see `SOURCE_COVERAGE_MATRIX.md`) after confirming via
   its official docs that it has a genuine free-text search API (unlike
   RePEc/IDEAS, whose public API turned out to be lookup-by-known-ID only, and
   unlike SSRN, which has no public API at all — neither was implemented for
   that reason). Same live-verification gap as the original four applied
   initially (this sandbox's egress policy blocks arxiv.org too) — but
   **resolved same day**: Erwin tested the arXiv deployment
   (`tekmesis-gijacmx65-axia-4.vercel.app`) directly. `/sources`'s live-status
   panel showed arXiv "Erreichbar", and a real search on a
   Technologie-&-Digital-Life question returned a genuine arXiv result
   ("Quantitative measurements of biological/chemical concentrations using
   smartphone cameras", arXiv, 2026) correctly labeled and flowing through
   screening/eligibility/teaser end-to-end. arXiv is now live-verified, same
   status as the original four.

## Blocking (must resolve before Phase 7 is signed off as production-ready)

13. **Partially resolved 2026-07-28: Supabase side is now live and confirmed
    working.** Erwin provisioned a real Supabase project (Zurich region),
    ran all 4 migrations (including the new `service_role` GRANT fix, see
    `STATUS.md`'s "Datenbank-Live-Einrichtung" entry for the full story —
    3 separate blockers found and fixed: env var scoped to the wrong Vercel
    environment, an unhelpful "Unbekannter Fehler" message masking the real
    cause, and the actual root cause — no table-level GRANTs because
    "Automatically expose new tables" was disabled at project creation).
    `/admin` now genuinely connects and shows real (empty) data instead of
    the "database not connected" fallback — the first real confirmation any
    Supabase-backed code path in this app has worked outside a unit test.
    **Fully resolved 2026-07-29.** Stripe test-mode Product/Price
    (`STRIPE_PRICE_ID_MVP_01`), the webhook endpoint
    (`STRIPE_WEBHOOK_SECRET`), and `STRIPE_SECRET_KEY`/publishable key are
    all set in Vercel for both Production and Preview. See item 14's
    2026-07-29 update below for the real end-to-end purchase this
    unblocked.
14. **Mostly resolved 2026-07-28 — the checkout is now wired end to end.**
    `/search` creates a real `preview_ready` report when a teaser renders;
    `PaywallPanel` has a working "buy" form (including the EU
    withdrawal-right waiver checkbox, decision #17) that hands off to
    `startCheckoutForReport` → a real Stripe Checkout Session; the webhook
    marks the report paid, captures the buyer's email, and immediately runs
    `generateReportContent` (the previously-missing step — search + AI
    enrichment → `ready`, or `failed` with a retry path); `/report/[token]`
    is a new route that renders the finished report or an honest interim
    status. See `STATUS.md`'s "Echte Checkout-Verdrahtung" entry for the
    full breakdown. **Still open:** no real Stripe test-mode purchase has
    been run yet — `STRIPE_WEBHOOK_SECRET` and `STRIPE_PRICE_ID_MVP_01`
    aren't set yet (secret key + publishable key are). This sandbox has no
    network access to Stripe either way, so the actual test-mode checkout
    (success, cancellation, bad signature, duplicate webhook — the
    `00_START_HERE_ERWIN.md` §9 list) is still unverified against a real
    account. Owner: Erwin, next step once the remaining two Stripe values
    are set in Vercel.

    **Update (2026-07-28): live-verified against the real Stripe test-mode
    account.** (a) **Cancellation:** aborting at Stripe Checkout correctly
    lands on `/checkout/cancel` with a working "erneut versuchen" CTA. (b)
    **Duplicate webhook / idempotency:** Stripe's own dashboard (Developers →
    Webhooks → Ereignisübermittlungen) showed a real, organic case — a
    `checkout.session.completed` delivery failed with "Zeitüberschreitung"
    (timeout), and Stripe's automatic retry 18s later succeeded with no
    double-fulfillment (matches the unit-tested idempotency behavior in
    `webhook.test.ts`). (c) **Bad signature:** covered by
    `webhook-route-handler.test.ts` (400 on a failing `verifyWebhookSignature`)
    — not re-run live, since crafting an invalid-signature request against
    the real endpoint needs direct HTTP access this sandbox's network policy
    blocks (`www.tekmesis.com` gets a proxy 403); low-value to chase further
    given the unit coverage.

    **Root cause of the observed timeout, found and fixed:**
    `/api/stripe/webhook/route.ts` had no `maxDuration`, unlike
    `/admin/report-preview` which explicitly sets `maxDuration = 60` for the
    identical reason — `fulfillCheckoutSession` awaits
    `generateReportContent` (live search + AI extraction/synthesis)
    synchronously before responding to Stripe, well past a default 10s
    serverless budget. Fixed by adding the same `maxDuration = 60`.

    **Residual gap, not fixed (needs a real architecture decision, out of
    scope for a quick fix):** `SupabaseWebhookEventRepository.recordIfNew()`
    claims an event (unique-constraint insert) *before* fulfillment runs,
    and `markProcessed()` only happens at the very end. If the function is
    killed mid-`generateReportContent` (a slow AI call, a Vercel redeploy,
    an actual timeout even at 60s) after the event is recorded but before
    `markProcessed`, a Stripe retry of the same event ID hits the unique
    violation, `recordIfNew` returns `false`, and `processStripeEvent`
    short-circuits at the top (`if (!isNewEvent) return { processed: false
    }`) — the report's own `status !== "checkout_started"` fallback check
    inside `fulfillCheckoutSession` is never reached, because execution
    never gets that far again. Net effect: a paid report can get
    permanently stuck in `paid` with no automatic recovery, and nothing
    currently flags this state as an error in `/admin` (CLAUDE.md: "failures
    visible in admin" — not yet true for this specific failure mode). Two
    directions for a future session: (1) move the "claim" to happen
    atomically with completion (e.g. only call `recordIfNew` after
    fulfillment succeeds, using the Stripe event ID plus a shorter-lived
    lock to still prevent concurrent duplicate processing), or (2) add an
    admin view that flags reports stuck in `paid`/`processing` past some age
    threshold, so a human can trigger the existing `processing → ready|
    failed` admin retry path manually.

    **Update (2026-07-28): direction (2) built — mitigation, not a fix for
    the underlying gap.** `src/lib/reports/stuck-report.ts` (`isReportStuck`,
    30-minute threshold — a real paid checkout this session finished in
    ~15-20s, so 30 minutes is a wide margin) is wired into `/admin`: a
    warning banner + a per-row ⚠️ mark any report stuck in `paid`/
    `processing`. While building this, found and fixed an adjacent real bug
    it depends on: `SupabaseReportRepository.update()` never actually
    refreshed `updated_at` (no DB trigger exists either — only `default
    now()` on INSERT), unlike the in-memory repository which always does.
    In production, every report's `updatedAt` would have stayed frozen at
    creation time forever, silently breaking anything — including this new
    stuck-report check — that trusts it to mean "last changed." Fixed in
    `toRowPatch()`. Also discovered the "paid" and "processing" cases need
    different admin actions: `retryReport()`'s underlying
    `transitionReportStatus(..., "processing")` call is only valid from
    `paid` (`paid → processing` is allowed) or `failed`
    (`failed → processing`) — `processing → processing` is **not** a valid
    transition (no self-loop in `lifecycle.ts`), so a report already stuck
    in `processing` cannot be safely retried this way. The "Erneut
    versuchen" button now also appears for a stuck `paid` report (it didn't
    before — only for `failed`); a stuck `processing` report still only
    offers "Blockieren", with the banner explaining why. Direction (1), the
    actual fix for the underlying claim-before-completion race, is still
    not attempted — this only makes the failure mode visible and, for one
    of its two stuck states, manually recoverable.

    **Update (2026-07-29): first real end-to-end purchase confirmed on the
    live production domain.** Every previous live verification (the
    2026-07-28 entries above) was run from `localhost:3000` against the
    real Stripe test account — the checkout session's own `success_url`/
    `cancel_url` in that event data confirm it. Today Erwin ran a full
    purchase through **`tekmesis.com` itself**: real Stripe Checkout page
    (showing the "TEKMESIS Evidence Report" product created this session),
    test card, redirect to `/checkout/success` with a real report token,
    webhook-triggered report generation, the "Report fertig" email
    received, and the finished premium report rendering correctly at
    `/report/[token]`. This is the first time the complete paid path has
    been confirmed working through the actual public domain rather than a
    local dev server. `STRIPE_PRICE_ID_MVP_01` needed a Vercel Production
    redeploy after being added (env var changes don't apply to an
    already-running deployment) — noted here in case that trips up a future
    env var change too.

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
11. **RESOLVED 2026-07-28.** `esummary` doesn't return abstracts, so every
    NCBI-sourced record used to stay `metadata_only`. Added a second,
    separate `efetch` call (`db=pubmed&retmode=xml&rettype=abstract`) over
    the same id list, parsed with `fast-xml-parser` (same library as the
    arXiv adapter). Handles both plain abstracts and structured ones
    (BACKGROUND/METHODS/RESULTS/CONCLUSIONS paragraphs, common for RCTs and
    systematic reviews — joined with their `Label` kept as a prefix, not
    discarded). A real found-and-fixed bug along the way: fast-xml-parser
    coerces purely-numeric element text (a PMID) into a JS `number`, which
    silently broke the `Map<pmid, abstract>` lookup against `sourceId`
    (always a string) until `extractPmid` explicitly normalizes with
    `String(...)`. The efetch call is a best-effort enrichment, not a hard
    requirement (docs/10: "Resilience") — on any failure it degrades
    silently to the metadata-only records already produced by
    esearch+esummary, rather than failing the whole NCBI source. Unit-tested
    (`ncbi.test.ts`) against a realistic two-article fixture (one
    structured, one plain abstract) and an efetch-failure case; not yet
    live-verified against the real E-utilities endpoint (same live-network
    gap as the rest of the source adapters, `OPEN_RISKS.md` #2).
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
    **Update (2026-07-28): Resend email sending is now live-verified.**
    `tekmesis.com` was added and verified as a Resend sending domain (DKIM
    TXT + SPF MX/TXT records added at Hostpoint, scoped to the `send`
    subdomain so the existing Hostpoint mailbox MX at the root domain is
    untouched); `EMAIL_API_KEY` and `EMAIL_FROM` are set in Vercel
    Production. Confirmed end-to-end via a real Stripe test-mode purchase:
    the "Dein TEKMESIS Evidence Report ist bereit" email arrived with a
    working report link. While fixing this, also found and fixed a
    pre-existing DNS misconfiguration unrelated to email: both
    `tekmesis.com` and `www.tekmesis.com` were resolving to Hostpoint's
    default hosting IP instead of Vercel (no dedicated `www` record
    existed; both fell through to a `*.tekmesis.com` wildcard A record
    pointing at Hostpoint), which made the live site itself unreachable
    over HTTPS. Fixed by pointing the root A record at Vercel's IP, adding
    an explicit `www` CNAME to Vercel, and removing the stale root AAAA
    record; both domains now show "Valid Configuration" in Vercel.
    PostHog forwarding remains unverified (site ID still unset) — separate
    from this item's email scope.

    **Update (2026-07-28): PostHog set up (EU Cloud) and a real reliability
    bug found and fixed while live-testing it.** A PostHog EU Cloud project
    was created and `NEXT_PUBLIC_ANALYTICS_ENABLED`/`_PROVIDER`/`_SITE_ID`
    set in Vercel. First live test (confirming a domain on `/search`, which
    triggers `domain_classified`) produced no event in PostHog's Live view.
    Root cause: `posthog-node` batches captured events and sends them on an
    internal timer rather than immediately; `forwardToPostHog` never called
    `flush()`, so on Vercel's serverless runtime the execution environment
    could freeze right after the response was sent, before that timer ever
    fired — the event was queued but never actually transmitted. Fixed by
    making `forwardToPostHog` async and awaiting `client.flush()` after
    `capture()`, and by awaiting it (wrapped in try/catch, same
    "analytics must never break the page" principle as the repository
    write) from `track()` instead of firing it and forgetting.
    **Re-verified live immediately after the fix deployed:** repeated the
    `/search` domain-confirmation test and confirmed real `domain_classified`
    events (library: `posthog-node`, several distinct runs) in PostHog's
    Events view — PostHog forwarding is now genuinely live-verified, not
    just configured.

16. **Report retention/expiry job (decision #5) is built; `CRON_SECRET` is
    now provisioned and the schedule live-verified.** `src/lib/reports/
    expire-reports.ts` (12-month expiry, `REPORT_RETENTION_MONTHS`) is wired
    to `GET /api/cron/expire-reports`, scheduled daily via `vercel.json`
    (`0 3 * * *`), and gated on `CRON_SECRET` (`Authorization: Bearer
    <CRON_SECRET>` — unset means the route always 401s, live-verified in
    this sandbox). **Update (2026-07-28):** `CRON_SECRET` (random
    `openssl rand -hex 32` value) is now set in Vercel Production; manually
    triggered twice via Vercel's Dashboard → Settings → Cron Jobs → Run, and
    both invocations logged `200` against the real Supabase project — the
    daily 03:00 UTC schedule can now actually fire. **Correction (2026-07-28):
    the secure-link report-viewer page this item previously flagged as
    missing already exists** (`src/app/report/[token]/page.tsx`, added in
    "Wire the real Stripe checkout end to end") — this note was stale. It
    hashes the URL token (`hashReportToken`), looks the report up via
    `findByTokenHash`, and renders a distinct notice per `ReportStatus`
    (not-found, processing, failed, expired, revoked, refunded) using the
    same `PremiumReportView` the admin preview uses; `/checkout/success`
    already links to it correctly. Live-verified in this session: the real
    Resend confirmation email's "Report ansehen" link opened this exact page
    and rendered the full 46-study Intervallfasten report. Only remaining
    gap: no dedicated test file for the page itself (`src/app/report/
    [token]/page.test.tsx` doesn't exist yet), though the token
    hashing/lookup and lifecycle transitions it depends on are unit-tested
    elsewhere.

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
    flow or a persisted report yet. **RESOLVED (2026-07-28): both open
    items here are closed.** (a) Real quality judgment: `ANTHROPIC_API_KEY`
    + `AI_EXTRACTION_ENABLED` were confirmed set in Vercel Production, and a
    live `/admin/report-preview` run ("Hilft Kreatin beim Muskelaufbau?", 27
    included studies) produced genuinely good, appropriately-hedged
    Haiku-tier synthesis — see the resolution note under item #2 above for
    the actual text. Quality looks solid at first read; keep spot-checking
    as more real questions run through it, but this is no longer
    unverified. (b) The persisted-report flow (`OPEN_RISKS.md` #14) was
    built and live-tested (real Stripe purchase → real generated report)
    earlier in this session, and `generate-report-content.ts` calls the
    same `enrichPremiumReportWithAi()` unconditionally — so AI synthesis is
    confirmed wired into the real paid product now, not just the preview
    tool.
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
    wrap it in a white badge. Footer and `/about` show plain text linking to
    `https://axia4.ch`. `src/components/brand/axia4-logo.tsx` and the copied
    asset were removed as unused. **Update 2026-07-28 (Treuhänder session):**
    the link text and the legal-entity wording it used to match were both
    changed — "AXIA4 GROUP" → "AXIA4" everywhere (footer, `/about`, email
    footer, `brand.parent`), and `/legal`'s seller line no longer says
    "AXIA4 GROUP, Einzelunternehmen von Erwin Fries" at all: AXIA4 is
    confirmed to be an umbrella brand only, the actual legal seller is Erwin
    Fries as a private individual ("Inhaber: Erwin Fries, 6332 Cham,
    Schweiz" — see decision #11). `CLAUDE.md`'s identity line was updated
    from "AXIA4 Digital product" to "AXIA4 product" to match (an explicit,
    direct instruction from Erwin, not inferred). Revisit only if Erwin
    later wants a real logo treatment (would need a transparent PNG/SVG
    requested directly from AXIA4). Not blocking anything.
21. **RESOLVED 2026-07-28 — moot, not just fixed.** This item used to track
    a stale Vercel env var (`NEXT_PUBLIC_AXIA4_DIGITAL_URL` pointing at an
    interim Lovable-hosted URL). The actual footer/`/about` AXIA4 link was
    since hardcoded straight to `https://axia4.ch` (Erwin: "Dann verlinke
    einfach auf AXIA4.ch") rather than fixed by updating the env var —
    which left the var declared but never read anywhere in `src/`. Removed
    the now-dead `NEXT_PUBLIC_AXIA4_DIGITAL_URL` entirely: `schema.ts`,
    `client.ts`, `schema.test.ts`, and both `.env.example` files. No
    Vercel action needed — nothing consumes it, so there was nothing left
    to configure.

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

    **Concept prepared 2026-07-29, awaiting Erwin's decision — no code
    written yet (`CLAUDE.md`: "No implementation before concept
    approval").** Re-researched all four adapters plus two new candidate
    sources to see if anything changed since the original finding above.
    Important caveat up front: this sandbox has no outbound network access
    to any of these APIs (same block as everywhere else in this project),
    so every finding below is doc/search-sourced, not a live-verified JSON
    response — a real spot-check (e.g. from `/admin`) is needed before
    committing to any option.

    *Research findings:*
    - **OpenAlex, Crossref:** unchanged. Confirmed via each provider's own
      published API schema (not just search results) that both only expose
      author-institution or publisher/funder geography — nothing
      population-level. Crossref's funder *country* additionally requires
      a second lookup against the separate Funder Registry endpoint; still
      institution-level even then.
    - **Europe PMC / PubMed (new finding):** both index MEDLINE MeSH
      headings, and MeSH has a real "Geographicals" tree (Z, e.g.
      descriptor `D005842`) that NLM's own documentation says describes
      physical/study location, not just subject content — genuinely
      population-adjacent, unlike author affiliation. But coverage is
      real-but-sparse: MeSH indexing only applies to the MEDLINE-indexed
      subset (preprints and non-MEDLINE Europe PMC content have none at
      all), and geographic tagging in practice skews toward
      epidemiology/public-health articles. A filter built on this would
      need a loud, permanent "based on medical indexing, only available for
      some studies — missing doesn't mean not relevant" disclaimer, not a
      quiet gap.
    - **ClinicalTrials.gov API v2 (new candidate, not previously
      considered):** no API key required; each registered trial has a
      genuinely structured, population/site-level `locations[]` field
      (city/state/country per site) — the most honest "country of study"
      data of anything researched. Reachable only for the subset of
      records that carry a registered NCT ID: Crossref has an explicit
      "Linked Clinical Trials" metadata feature or PubMed's
      `SecondaryID`/`DataBankList` sometimes carries the same ID.
      Realistic scope: RCTs only, and only the ones actually
      linked/registered with an ID present in the metadata we already
      fetch — likely a minority of included studies, not a general filter.

    *Three options, effort-ordered:*
    1. **Institution-country badge, not a filter (OpenAlex only).** Map
       the already-fetched `authorships[].institutions[].country_code`
       into a new optional `NormalizedRecord` field, show it as a small,
       clearly-labeled "Forschungseinrichtung: [Land]" line on study
       cards/profiles — no filtering, so no risk of narrowing results on
       shaky grounds. Smallest effort (one adapter mapping change + one UI
       line + dictionary strings), but doesn't deliver an actual filter,
       just more transparency about what's already shown.
    2. **MeSH geographic-location filter (Europe PMC + NCBI), explicitly
       caveated.** A real optional filter ("Studienregion, soweit
       erfasst"), scored against extracted MeSH Z-tree terms, with a
       permanent, prominent incompleteness disclaimer and a distinct
       "nicht erfasst" bucket rather than silently dropping unindexed
       studies. Medium effort: extend the Europe PMC adapter and the NCBI
       efetch call (already being parsed for abstracts this session — the
       MeSH heading list is available in the same response, low
       incremental cost there) to extract geographic MeSH terms, add the
       field to `NormalizedRecord`, build a new filter following the
       existing `filters.ts` pattern (age/study-type), add scope-filter UI
       + dictionary strings. Delivers a real filter, but only for two of
       four/five sources, with real sparsity.
    3. **ClinicalTrials.gov cross-reference for linked RCTs.** The most
       honest data, the most work: extract an NCT ID when present in
       Crossref/PubMed metadata, add a new outbound lookup to
       ClinicalTrials.gov v2 (new base-URL env var, new adapter-shaped
       module with its own tests/fixtures, matching the existing adapter
       pattern), wire `LocationCountries` into `NormalizedRecord`, build
       filter UI. Coverage would likely be a small minority of included
       studies (only linked, registered RCTs), so worth sizing that
       percentage with a real query before committing engineering time.

    *Recommendation, not a decision:* option 1 is a safe, quick way to
    add real transparency without the honesty risk a half-covered filter
    carries, but doesn't fulfil the original ask (an actual filter).
    Option 2 is the most realistic path to a genuine filter at reasonable
    effort, provided the incompleteness is surfaced loudly rather than
    quietly. Option 3 is the gold-standard answer if a real "country of
    study population" filter matters enough to justify a new source
    integration, but its actual coverage percentage is unknown and should
    be checked live before scoping further. Owner: Erwin — pick an option
    (or none, keeping the filter deferred) once back; live-verifying the
    exact OpenAlex/Europe PMC/PubMed/ClinicalTrials.gov JSON shapes from an
    environment with real network access should happen before writing any
    adapter code, regardless of which option is chosen.

23. **RESOLVED 2026-07-28 — live-verified end to end.** Same
    live-network-validation gap as the four search adapters
    (`OPEN_RISKS.md` #2) meant this sandbox could never test it (no
    outbound access to Crossref's API), so `lookupByDoi()`'s success path
    (`src/lib/source-adapters/crossref.ts`) was only verified via
    mocked-fetch unit tests. Live-tested on `www.tekmesis.com` via
    `/topics`'s `StudyLookupForm` with a real, web-search-confirmed DOI
    (`10.1371/journal.pone.0105948`, a genuine PLOS ONE paper): the title,
    venue ("PLoS ONE"), and year (2014) all resolved correctly from a live
    Crossref response, the `SeedStudyPanel` ("Deine Studie") rendered
    correctly, and the comparison search ran for real (22 candidates, 2
    duplicates removed, 10 included). Both honest failure states (invalid
    DOI, lookup failed) were already live-verified earlier since they
    don't depend on network access. Scoped to Crossref only for v1, not
    also OpenAlex/Europe PMC/NCBI — see `STATUS.md`'s "Compare a study you
    already have" entry for the reasoning; still valid, not revisited here.

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

    **Update (2026-07-28): not reproduced in 3 separate attempts today —
    downgrading confidence, not marking resolved.** Ran (a) the rate-limit
    test in isolation, (b) `search.spec.ts` + `security-headers.spec.ts`
    together, and (c) the full 62-test suite via `npm run test:e2e` — all
    three runs passed cleanly, zero failures, first try each time. No code
    in `in-memory-rate-limiter.ts`, `get-rate-limiter.ts`,
    `check-free-search-limit.ts`, or the e2e `webServer` config was touched
    this session, so nothing was actually fixed here — either this is a
    genuinely intermittent/timing-dependent flake that didn't trigger today
    (sandbox load, scheduling luck), or something about this particular
    sandbox instance differs from whatever produced the original failure.
    Per `CLAUDE.md` ("never claim a test passed if it was not run"): it was
    run, three times, and passed each time — that's what's being reported,
    not a claim that the underlying flake is fixed. Left as-is rather than
    closed; if it recurs, the reproduction commands above and the
    single-vs-multi-process `next start` hypothesis are still the next
    thing to check.

    **Update (2026-07-29): 4th clean run, after the French-locale
    rollout's changes.** Ran the full `npm run test:e2e` suite (62 specs,
    including `search.spec.ts`'s rate-limit test and
    `security-headers.spec.ts`) against a fresh `npm run build && npm run
    start` — **62/62 passed, zero failures**, ~1.3 min. This is now 4
    consecutive clean full-suite/targeted runs across two different
    sessions with substantial code changes in between (marketing pass,
    then the entire French-locale rollout), none of which touched
    `in-memory-rate-limiter.ts`, `get-rate-limiter.ts`, or the e2e
    `webServer` config. Confidence this was sandbox-instance-specific
    flake (not a real bug) is now fairly high — still not marking fully
    resolved per `CLAUDE.md`'s "never claim a test passed if it was not
    run" (a flake that reproduced once could recur), but this item no
    longer needs proactive attention; only revisit if it's actually seen
    failing again.

25. **Two items from the "WOW-Zusatzleistungen" marketing brainstorm
    (Erwin's request) were deliberately not built, on top of the 13 that
    were.** Both need a real product/data decision first, not just code:
    - **Themen-Digest E-Mail:** the buildable *infrastructure* (an opt-in
      signup form, storage, unsubscribe, a Resend template) is
      straightforward and follows the exact pattern already used for
      transactional email. What isn't buildable here is the actual
      newsletter *content* — "latest findings in your topic" requires a
      real, recurring editorial/curation process (someone deciding what's
      genuinely worth sending, backed by real evidence, on a real
      cadence). Building the signup pipe without that process would
      either collect email addresses for a newsletter that never sends
      (a privacy cost — `CLAUDE.md`: "no unnecessary personal data" —
      for zero benefit) or invite filling it with generated-sounding
      copy, which risks brushing against the evidence-integrity rules if
      done carelessly. Needs Erwin's decision on who curates it and how
      often before the signup form is worth building.
    - **Evidenz-Update-Check:** a genuinely recurring "notify me when new
      studies appear" mechanism is architecturally adjacent to a
      subscription (recurring checks tied to one visitor, running
      indefinitely) — `CLAUDE.md`: "No subscription in MVP". A one-time,
      user-triggered re-check ("check again now") would avoid that, and
      could reuse the existing cron/expiry infrastructure, but still
      needs a decision on where its result goes for someone without an
      account (no mandatory account exists per `CLAUDE.md`) — e-mail is
      the only channel that doesn't require inventing account state, so
      this is really the same open question as the digest email above:
      needs Erwin's sign-off on any recurring-contact mechanism before
      it's built, not a default "yes" from this session.
    - The following were already covered in `STATUS.md`'s
      "WOW-Zusatzleistungen" entry as bewusst nicht vorgeschlagen and
      remain so: a "Wissenschafts-Mythen" content section (would require
      genuinely researched, non-fabricated evidence-checks per myth — a
      content task, not a code task), a full "Entscheidungsassistent" /
      "Vergleichsrechner" (each is architecturally a new report type,
      not an incremental feature, and needs its own concept-approval
      pass per `CLAUDE.md`'s workflow rule), FR/IT localization (hundreds
      of dictionary strings — an AI-drafted translation of legal/evidence
      copy without human review is a quality risk on exactly the content
      that most needs to be precise), and an "Evidenz-Trend-Indikator"
      (would need historical data across repeated searches over time,
      which doesn't exist yet — building it now would mean either
      showing a fake trend or silently doing nothing, neither of which
      is better than not having it).

26. **RESOLVED 2026-07-28.** The high-risk detector's `"scheidung"` term (for
    `legal_financial_high_stakes`) false-positived on "Entscheidung(en)"
    (decision) — a genuinely common German word, not an edge case, and
    directly relevant since one whole topic category is literally named
    "Konsum & Kaufentscheidungen". Fixed per-term (not with a blanket
    word-boundary change, for the reason this item originally laid out:
    German compounding needs the term to still match as a *suffix*, e.g.
    "Blutkrebs"/"Hautkrebs" for `cancer`'s "krebs" term, which a global
    boundary check would break into false negatives — the unacceptable
    failure mode per `high-risk.ts`'s own design comment). The actual fix:
    a negative-lookbehind regex (`/(?<!ent)scheidung/`) scoped only to this
    one term, excluding the "entscheid*" family while still matching
    genuine divorce terms (Scheidung, Ehescheidung, Scheidungsanwalt).
    Live-verified with new test cases in `high-risk.test.ts`. **Still
    open:** the broader suggestion this item made — auditing every DE/EN
    term in `TERMS`/`CHILD_TERMS`/`TREATMENT_TERMS` for similar
    accidental-substring risk, not just this one found instance — was not
    done; only the one live-found case was fixed.

27. **RESOLVED 2026-07-29 — live-verified against all 12 topics via
    `/admin/example-questions`.** Erwin ran all 61 example questions
    (some topics have 6, not 5, after task #134's addition) through the
    real search+eligibility pipeline on the live production domain.
    Overall picture: healthy. Notably, the same "stabiler Gewohnheiten"
    question from item 29's bug report dropped from 20 (mostly
    irrelevant) included studies to 3 genuinely relevant ones, correctly
    now labeled "eignet sich mit Einschränkungen" instead of falsely
    looking well-supported — direct live confirmation the item-29 fix is
    deployed and working. Umwelt/Nachhaltigkeit questions all came back
    "mit Einschränkungen" on small counts, matching the coverage gap
    already documented in item 5. Two questions in Psychologie,
    Wohlbefinden & Gewohnheiten came back `not_eligible` with **zero**
    included studies and **no** source error (gratitude/mindfulness
    exercises; social contacts and general well-being) — the same
    questions in English came back with 18 and 24 included studies
    respectively, proving this was a translation bug, not a real
    evidence gap. **Root-caused and fixed same day**, see the
    `DE_EN_DICTIONARY`/`STOPWORDS` update below.

    **New finding from this sweep:** 6 of the 61 questions (~10%) hit a
    `crossref: crossref request failed after 3 attempt(s)` source error,
    spread across 5 different topics (Gesundheit, Lernen, Beziehungen,
    Konsum ×2, Umwelt) — too frequent and too spread out to be one-off
    noise. Two of those (`Eignet sich nicht`, 0/0) means the *only*
    source for that question's candidates was Crossref and it failed
    outright. Not investigated further here (this sandbox still has no
    live network access to Crossref to reproduce/diagnose directly) —
    worth a closer look at Crossref's current rate limits/reliability
    from a real network next.

    **Second sweep, same day, English locale, worse pattern with
    OpenAlex:** starting partway through (Sleep & Regeneration onward),
    every OpenAlex request failed for the rest of that batch (Fitness:
    5/5 questions, Learning: 5/5) before recovering on its own after a
    pause. Checked `src/lib/source-adapters/http.ts`'s shared
    `fetchWithRetry`: 2 retries with ~300ms/600ms backoff, no special
    handling for HTTP 429 or a `Retry-After` header — nowhere near
    enough to survive an actual rate-limit window once tripped, which
    plausibly explains the "once it starts failing, it keeps failing for
    the rest of the batch" shape (unlike Crossref's scattered single
    failures above). Very likely self-inflicted by `/admin/example-
    questions` firing many searches back to back with no delay between
    them — worth eventually either spacing out that admin tool's
    requests, or honoring `Retry-After`/backing off harder specifically
    on 429 in `fetchWithRetry`. Real-traffic implication: a genuine burst
    of concurrent users could trip the same limit, though the existing
    per-source resilience design means a report still generates from the
    remaining working sources rather than failing outright.

    **RESOLVED same day.** `fetchWithRetry` now treats HTTP 429
    differently from a generic error: it honors the response's
    `Retry-After` header (delta-seconds or HTTP-date, per RFC 9110
    §10.2.3) when present, capped at 3 seconds so a slow/misbehaving
    source can't blow the caller's own function-duration budget (e.g.
    `/admin/report-preview` and the Stripe webhook route's `maxDuration =
    60`); with no `Retry-After` header, 429s still get a longer base
    backoff (1000ms vs. the generic 300ms) than a transient network blip.
    Deliberately did not touch `/admin/example-questions`'s
    request-spacing — the shared retry fix addresses the root cause for
    real traffic too, not just this one admin tool. 3 new tests added
    (`http.test.ts`, fake timers); full suite green (650 unit tests).

    **Two Psychologie translation gaps found and fixed same day**
    (`src/lib/search/de-en-dictionary.ts`, `relevance.ts`'s `STOPWORDS`):
    reproduced locally (no network needed — German query building is pure
    dictionary lookup since item 29's fix) against the exact two
    questions above.
    1. "Dankbarkeits- oder Achtsamkeitsübungen" — German's elliptical
       shared-suffix compounding drops the first word's own "-übungen"
       since the second word supplies it, leaving the token "dankbarkeits"
       (not "dankbarkeit") and the untruncated "achtsamkeitsübungen"
       (not "achtsamkeit") — neither matched the dictionary's exact-word
       entries. Added both forms.
    2. "Wie hängen X und Y zusammen?" — "hängen"/"zusammen" (the
       "are related" connector phrase) were real, untranslated German
       words that diluted the query alongside the correctly-translated
       content words. Added to the generic-connector-word stopword list
       (same treatment as "hilft"/"wirkt"/"verbessert").

    Verified: both questions now translate to clean English queries
    ("gratitude mindfulness exercises effective" /
    "social contacts general well-being"). Regression tests added
    (`query-translation.test.ts`); full suite green (647 unit tests).

    **Live-confirmed deployed and working (2026-07-29, same day):** Erwin
    re-ran Psychologie, Wohlbefinden & Gewohnheiten in German after the
    fix shipped — "Dankbarkeits- oder Achtsamkeitsübungen" now returns
    13 included/7 result-bearing (was 0/0), "Wie hängen soziale Kontakte
    und allgemeines Wohlbefinden zusammen?" now returns 21/10 (was 0/0).

    **Full 12-topic × 3-locale live sweep completed this session.**
    Every topic checked in German, English, and French via
    `/admin/example-questions` (36 topic/locale combinations, ~180
    question checks total). Picture across all of it: healthy — no
    domain mismatches, no other zero-result-without-error surprises, the
    Umwelt/Environnement/Environment coverage gap consistently shows up
    across all three locales as expected (item 5), and the two
    translation-gap fixes above are the only real bugs this sweep
    surfaced (both fixed and confirmed same day). Remaining known
    issues from this sweep are the Crossref intermittent-timeout pattern
    and the OpenAlex rate-limit-under-burst-load finding, both above,
    neither fixed.

28. **RESOLVED 2026-07-29 — Erwin approved.** French `/legal` and
    `/privacy` page content (added with the French locale rollout) is a
    faithful translation of the already-approved German/English wording
    (same seller entity, same Art. 8 MWSTG reverse-charge language, same
    retention/privacy commitments) — not new legal content, no new
    claims. Erwin signed off on the translation directly in chat
    (2026-07-29) rather than requiring a separate native-French legal
    reviewer pass, since no legal position changes — only the language
    does. If the wording is ever substantively edited (not just
    re-translated), that edit needs its own sign-off.

29. **RESOLVED same day, found via the first real paying-path purchase
    (2026-07-29) — a genuinely bad report was sold (to Erwin, in test
    mode) before this was caught.** Erwin's real end-to-end Stripe test
    purchase (item 14's 2026-07-29 update) used the German question
    "Welche Methoden helfen beim Aufbau stabiler Gewohnheiten?" — a
    legitimate habit-formation question. The delivered report's 20
    "included" studies were dominated by completely unrelated hits: an
    1849 book about horse stables, three papers on spider anatomy
    ("structure and habits of spiders"), a soil-structure paper on
    "water-stable aggregates", "Stable Isotope Probing" in plant biology,
    and a neutron polarimeter paper — while a genuinely relevant study on
    habit-measurement scales (SRBAI) was pushed out.

    **Root cause:** the same-day French auto-learn mechanism (tasks
    #143/#144, `learned_search_terms` cache + AI fallback in
    `query-translation.ts`) was implemented generically over every locale
    with a static dictionary, not scoped to French only as actually
    approved ("für den Moment würde ich französisch noch implementieren
    wollen"). This silently gave German the same AI-fallback tier. The AI
    translated the single word "stabiler" with no sentence context (only
    the source-language name — see the old `term-translation-ai.ts`
    prompt) to the bare adjective "stable" — technically defensible, but
    catastrophic for literal keyword search: "stable" is one of the most
    overloaded words in scientific literature (stable isotopes, stable
    operation, water-stable soil, even literal horse stables), so it
    matched broadly across completely unrelated fields. Confirmed
    mechanically (not just theorized): a local, no-network reproduction
    using `relevance.ts`'s actual `meetsRelevanceThreshold` logic against
    the real record titles from the PDF showed the false positives are
    only included when the query contains "stable"; with "stabiler" left
    untranslated (the pre-existing, tested German behavior), all of them
    are correctly excluded.

    **Fix:** `AUTO_LEARN_LOCALES` in `query-translation.ts` now explicitly
    restricts the learned-term cache + AI fallback tier to `["fr"]`.
    German is back to its original, proven behavior: static dictionary
    only, unknown tokens pass through untranslated (safe — a German word
    essentially never spuriously matches English record text). Also
    hardened the AI fallback itself for French (still in scope): the
    full original question is now passed to the model as disambiguation
    context (not just the isolated word), which should reduce — though,
    since "stable" itself would still be a risky bare-word translation
    even with context, not eliminate — this class of mistranslation
    happening again for French. Regression test added
    (`query-translation-ai-enabled.test.ts`) asserting German never calls
    the learned-term repository or the AI fallback even with AI fully
    configured.

    **Residual, not fixed:** the underlying fragility — that a single
    generic English word can flood literal keyword-overlap search across
    an entire multi-disciplinary database like Crossref — still exists
    for any term (static-dictionary or AI-sourced) that happens to be
    common outside its intended sense, for any locale. No broader
    safeguard (e.g. penalizing very common English words, phrase-level
    matching instead of bag-of-words) was attempted here; worth
    considering if this pattern recurs.

    **Not cleaned up:** if `AI_EXTRACTION_ENABLED`/`ANTHROPIC_API_KEY`
    were live at the time (they were — the purchased report has real
    AI-synthesized key findings), a `locale: "de"` row for `term:
    "stabiler"` (`translation: "stable"`) was likely written to
    `learned_search_terms`. Harmless dead data now that German never
    reads this table again, but can be deleted manually if desired:
    `delete from learned_search_terms where locale = 'de';` (German never
    uses this table going forward, so deleting all `de` rows is safe).

30. **Confirmation email possibly dropped by the webhook's own timeout, first
    live-mode purchase (2026-07-30).** During Stripe live-mode activation,
    Erwin's own real CHF 9.90 test purchase produced a fully generated,
    viewable report (`/report/[token]` loaded correctly with all 39 studies),
    but the TEKMESIS "report ready" confirmation email never arrived (Stripe's
    own "you received a payment" notification did, confirming the charge
    itself was fine). The webhook delivery was independently retried twice
    by Stripe and recorded as failed/timed out on Stripe's side (unrelated
    308-redirect issue, fixed separately the same session) before finally
    reaching the app.

    **Working theory, not confirmed:** `generate-report-content.ts` sends the
    "ready" email as the last step, after the full live search + AI
    synthesis chain — under real network latency (first-ever live-mode run,
    no cached studies yet) this run likely approached or exceeded the
    route's `maxDuration = 60`, and Vercel may have terminated the function
    after the report was persisted as `ready` but during/before the
    `sendEmail` call. Could not be confirmed via Vercel Runtime Logs — the
    Hobby plan only retains 12h of log history, and by the time this was
    investigated the window had passed.

    **Decision (Erwin, 2026-07-30):** treat as non-blocking for now — no
    real customers yet, this was Erwin's own test purchase, and the report
    itself was unaffected. Explicitly declined decoupling email-send from
    report-generation as a preemptive fix. Revisit if this recurs during the
    beta (i.e. a real report generates successfully but its "ready" email
    doesn't arrive) — at that point, decoupling the email step into its own
    retryable action (or moving it earlier/independent of the AI/search
    chain) would be the fix.

    **Update (2026-07-31):** a second live-mode purchase (via the new
    100%-off `TESTKAUF-2026` promo code, see below) completed normally —
    report generated and the confirmation email arrived without issue.
    Supports the "one-off slow run" theory over a structural bug; no code
    change made. Still worth a second data point before fully closing this.

31. **RESOLVED 2026-07-31 — `/admin/payments` was empty despite real, successful
    Stripe charges; the one-click refund action had nothing to act on.**
    Found while trying to refund Erwin's live test purchase. Root cause:
    `startCheckoutForReport` (`src/lib/checkout/start-checkout.ts`) created
    the Stripe Checkout Session and updated the `Report`'s own status/
    `stripeCheckoutSessionId`, but never called `paymentRepository.create()`
    — no code path in the actual app (only tests) ever inserted a `Payment`
    row. The webhook's `fulfillCheckoutSession` already had the matching
    `findByCheckoutSessionId` → mark-"paid" logic, but silently no-opped
    every time since it never found a row (`if (payment && ...)` guard).
    Report generation and the buyer-facing flow were unaffected — this only
    broke the admin-side payment record and refund tooling (`CLAUDE.md`:
    "manual refunds supported", "failures visible in admin").

    **Fix:** `startCheckoutForReport` now takes a `paymentRepository`
    dependency and creates a `Payment` row (status defaults to `"pending"`
    per the DB schema) right after the Checkout Session is created, keyed
    by that session's ID — one row per checkout attempt, so an abandoned
    retry's row just stays "pending" rather than being overwritten. Wired
    the real `SupabasePaymentRepository` into the calling server action
    (`src/app/search/checkout-actions.ts`). Regression tests added
    asserting the Payment row's fields and that a retry creates a second,
    independent row. Both of Erwin's real live-mode purchases (2026-07-30
    and 2026-07-31) predate this fix and have no corresponding `Payment`
    row — refunding them requires using the Stripe Dashboard directly
    rather than `/admin/payments` (documented for that reason).

## Not risks, but explicit go/no-go gates already defined

- Beta continue/optimize/pause/stop thresholds: decision #15.
- Independent final review (`18`) must reach GO before production, per its own
  P0-defect-blocking rule.

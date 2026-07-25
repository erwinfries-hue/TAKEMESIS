# Concept Review Notes

Status: draft — produced during mandatory concept-review phase, before any implementation code.
Scope: all 21 package documents, `.env.example`, `PACKAGE_MANIFEST.json`, and the supplied visual references (one-pager, 7 premium-report reference pages, AXIA4 logo) have been read.

## Overall assessment

The package is unusually complete for a pre-code brief: product strategy, taxonomy, UX flows, evidence-safety rules, monetization/lifecycle, data model, admin/analytics, privacy/legal/cost/abuse controls, design system, acceptance criteria, phased execution plan, deployment runbook, AXIA4 handover copy, and an independent-review prompt are all specified and mostly internally consistent. The core idea — a broad-domain "evidence navigator" that turns a personal question into a transparent, source-linked report, gated by a genuine researchability/eligibility check before payment — is coherent and differentiated from a plain search tool. The evidence-safety posture (no fabricated citations, no association-to-causation, explicit confidence labels, retraction/protocol handling) is unusually rigorous for an MVP and is the right foundation to build on, especially given AI is in the loop.

The biggest real risk is not the product idea but scope: this is a 12-source-domain, multi-adapter, AI-assisted, paid, DACH-facing product with legal/tax exposure, built by one founder. The docs already anticipate this by defining a beta that is much narrower than the full taxonomy, and by requiring explicit human approval on legal/tax/pricing before launch. My job now is to help narrow P0 to something a single founder can actually ship, operate, and support.

## Strongest opportunities

1. **Genuine eligibility gate as the trust anchor.** Refusing to sell when evidence is thin is the single strongest differentiator — it should be built and tested first, before the report renderer, so "not eligible" is a real, working outcome from day one rather than an afterthought.
2. **Adapter architecture.** Building OpenAlex/Crossref/Europe PMC/NCBI behind one normalized-record interface from the start avoids a PubMed-only rewrite later and makes the beta's actual source coverage easy to state honestly.
3. **Free teaser is generous but structurally safe.** It shows real search statistics and study titles/links (already public information) without giving away the synthesis, comparison matrix, or confidence reasoning — so it can build trust without cannibalizing the CHF 9.90 report.
4. **AXIA4 relationship is cleanly decoupled.** A static introduction page linking out (no iframe/proxy) keeps the two properties independently deployable and avoids the DNS/auth complexity a shared architecture would create.

## Major contradictions / tensions to resolve

1. **"Broad, not health-only" vs. beta narrows to non-health domains.** `01` and `03/04` insist the product is not health-only and that a health-only bias must be removed (`14`, acceptance criteria). But `04`'s own beta recommendation puts learning/work/sleep/nutrition/fitness/habits first and suggests high-risk medical topics may be *entirely excluded* in beta (`08`). That's not actually a contradiction if "Gesundheit & Prävention" stays visible but scoped to low-risk, non-diagnostic questions (e.g., general prevention, not symptoms/treatment) — but it needs an explicit beta topic list, because right now two documents imply different defaults.
2. **Report-depth promise vs. undefined eligibility thresholds.** `06` promises an 8–12 page equivalent report; `07` explicitly says *not* to hard-code eligibility thresholds before concept approval. Until minimum study count / source-coverage thresholds are fixed, "eligible" is not yet a well-defined state, which blocks both the eligibility engine and the Stripe paywall copy.
3. **Price fixed at CHF 9.90 vs. "price confirmation after cost estimate" still open.** The price is stated as final everywhere (`01`, `09`, manifest) but `02` lists "price confirmation after cost estimate" as an open decision. With Anthropic API calls plus 3–4 external source APIs per report, a real per-report cost estimate should exist before the price is treated as locked, since it affects contribution margin and the cost-cap logic in `12`.
4. **No mandatory account, yet 12-month persistent paid-report links.** This is workable (token-based access is an accepted pattern) but sits close to privacy tension: anyone with the link can view a report containing the user's original question. `12` already requires a visible warning and revocation — this just needs to be carried through consistently into the UI copy, not a contradiction but a sharp edge worth flagging now.

## Major launch risks

1. **Single-founder operational load.** Refunds, correction requests, deletion requests, and safety escalations (e.g., a user pushing a health question through anyway) all route to one person. Beta size and response-time commitments should be set with this in mind.
2. **DACH cross-border VAT/tax treatment.** Selling a digital product from Switzerland to EU consumers (Germany/Austria) can trigger EU digital-services VAT obligations (OSS) depending on volume and structure. `12` correctly marks this as requiring human legal/tax approval — this is a real go/no-go item, not paperwork, and should be resolved before live Stripe mode, not just before "launch" in general.
3. **Legal seller identity undefined.** No confirmed registered entity/address for invoices, Stripe account, and legal footer yet. Needed before Stripe live mode and before `/legal` page content can be finalized.
4. **AI + multi-source cost exposure without a fixed cap.** `12` requires caps but no numbers exist yet. Without an early estimate, it's possible to ship an eligibility gate that lets through more "eligible" questions than the cost model can sustain at CHF 9.90.
5. **NCBI/E-utilities rate limits.** Without an `NCBI_API_KEY`, requests are capped at 3/sec; this is fine for MVP volumes but should be a conscious choice, not a surprise in production.
6. **Admin auth is minimal by design (`ADMIN_AUTH_SECRET` + email allowlist).** Acceptable for a closed beta with one operator, but should not silently carry into public MVP without revisiting (e.g., adding MFA) once report volume includes real payment data.

None of the above are blockers to starting the concept-decision dialogue — they are exactly the open decisions the package itself flags in `02_CONCEPT_REVIEW_PROTOCOL.md`. The next step is to work through the mandatory open-decision list one question at a time, starting with the ones that gate everything downstream (beta topic scope, high-risk exclusion, eligibility thresholds, price/cost confirmation), per `01_MASTER_PROMPT_FOR_CLAUDE_CODE.md`.

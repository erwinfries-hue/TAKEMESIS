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

## Non-blocking, monitor through beta

2. **Single-founder operational load.** Refunds, corrections, deletions, and safety
   escalations all route to one person. Mitigated by: 3–5 business day response
   commitment (decision #10), 15-person beta size (decision #15), admin dashboard
   surfacing safety issues distinctly. Revisit if beta volume exceeds sustainable
   response time.
3. **Weaker source coverage in non-biomedical, non-education categories.** Konsum &
   Kaufentscheidungen, Umwelt/Nachhaltigkeit, Beziehungen & Kommunikation are
   expected to produce more `eligible_with_limitations`/`not_eligible` outcomes
   (see `SOURCE_COVERAGE_MATRIX.md`). Monitor eligible-rate by category at the beta
   checkpoint; consider narrowing active categories if a specific one consistently
   fails to produce sellable reports.
4. **AI + free-teaser cost exposure.** Bounded by the 5/day/IP free-search limit
   (decision #7) and per-report input caps, but actual AI spend should be tracked
   from day one against the CHF 1.00–1.50/report estimate (decision #9) to confirm
   the estimate holds at real usage volumes.
5. **NCBI E-utilities rate limits without an API key.** 3 req/sec cap is fine at
   beta volume; revisit (add `NCBI_API_KEY`) if search volume grows.
6. **Admin auth is minimal (email allowlist + shared secret).** Acceptable for a
   single-operator closed beta; revisit (e.g. add MFA) before public MVP once real
   payment data volume increases.
7. **Report-link sharing (decision #6) means the link is the only access control.**
   Mitigated by visible warning + self-revoke, but a leaked link (e.g. posted
   publicly) remains viewable until revoked. No additional MVP mitigation planned;
   monitor via admin revocation tooling.

## Not risks, but explicit go/no-go gates already defined

- Beta continue/optimize/pause/stop thresholds: decision #15.
- Independent final review (`18`) must reach GO before production, per its own
  P0-defect-blocking rule.

# Monetization, Stripe, and Report Lifecycle

## Initial offer

- Premium Evidence Report
- CHF 9.90
- one-time payment
- no subscription
- price version `MVP-01`

## Central price configuration

Store:
- Stripe Price ID
- amount minor: 990
- currency: CHF
- price version
- active date
- environment

## Lifecycle states

- draft
- preview_ready
- checkout_started
- paid
- processing
- ready
- failed
- refund_pending
- refunded
- blocked
- expired

## Fulfillment

1. Create report draft.
2. Create Stripe Checkout Session server-side.
3. Include internal report ID and price version in metadata.
4. Verify signed webhook.
5. Store event ID.
6. Process idempotently.
7. Mark paid.
8. Start controlled generation.
9. Validate report.
10. Mark ready.
11. Send email.
12. Record analytics.

## Rules

- success page does not prove payment
- no duplicate report generation
- no duplicate fulfillment
- browser link available even if email fails
- failed paid report visible to admin
- permanent failure becomes refund_pending
- beta refunds may be manual
- tax-ready architecture, activation only after legal/tax decision

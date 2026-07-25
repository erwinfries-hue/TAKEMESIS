# Beta, Privacy, Legal, Cost, and Abuse Controls

## Beta stages

1. Internal alpha
2. Closed beta: 10–20 users
3. Extended beta: 30–50 users
4. Public MVP after P0 success

## Input warning

German:
„Bitte geben Sie keine Namen, Dokumente oder vertraulichen persönlichen Daten ein.“

For health topics:
„Bitte geben Sie keine individuellen Diagnosen, Medikamentenlisten oder Gesundheitsakten ein.“

## Retention defaults for approval

- unpaid drafts: 7 days
- cancelled checkout drafts: 7 days
- paid reports: 12 months
- technical logs: 30 days
- accounting/payment data: legal requirements
- feedback/issues: documented lifecycle

## Sharing

- non-guessable token
- no account required
- clear warning that anyone with the link may view
- admin revocation
- optional expiry
- no sequential ID

## Legal/tax checklist

- seller identity
- address
- support email
- CHF price
- tax-inclusive/exclusive wording
- Swiss VAT status
- DACH cross-border treatment
- receipt/invoice process
- refund terms
- privacy disclosure
- Stripe/AI/email processors
- report retention
- terms
- disclaimers

Human approval required.

## Cost controls

- cap candidate records
- cap included studies
- cap AI input/output
- bounded retries
- external-request timeouts
- cache reusable results
- no full premium synthesis before payment
- prevent duplicate jobs
- daily/monthly warnings
- cost per search/report
- contribution-margin estimate

## Abuse controls

- IP/session rate limits
- request-size limits
- bounded free usage
- bot monitoring
- admin auth
- webhook verification
- token hashing
- no public internal IDs
- optional CAPTCHA readiness

## Ethical conversion

Never use:
- false urgency
- countdown
- fear amplification
- hidden subscription
- deceptive teaser
- artificial scarcity
- preselected extras

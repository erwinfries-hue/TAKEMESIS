# UX, User Flows, and Pages

## Routes

- `/`
- `/topics`
- `/search`
- `/preview/[token]`
- `/checkout/success`
- `/checkout/cancel`
- `/report/[token]`
- `/example-report`
- `/methodology`
- `/sources`
- `/privacy`
- `/legal`
- `/about`
- `/admin`

## Landing page

1. TEKMESIS brand and promise
2. Topic-category inspiration grid
3. Own-question input
4. Complete curated example-report preview
5. How it works
6. Free versus Premium
7. Source/method transparency
8. Trust/privacy/beta
9. Price and no-subscription message
10. Footer/legal

## Question flow

1. User selects topic or writes question.
2. System identifies domain.
3. System identifies risk level.
4. System proposes a researchable interpretation.
5. User confirms, edits, or selects one of up to three alternatives.
6. System shows intended scope before searching.

Avoid long questionnaires.

## Search progress

Show meaningful stages:
- Frage wird strukturiert
- passende Datenquellen werden gewählt
- Studien werden gesucht
- Relevanz wird geprüft
- Evidenz wird verglichen
- Vorschau wird vorbereitet

Do not fake progress.

## Eligibility results

### Eligible
Premium Report may be sold.

### Eligible with limitations
Show prominent limitations before checkout.

### Not eligible
No payment. Explain reason and offer refinement.

### Restricted high risk
No individualized synthesis. Provide safe general orientation or redirect to qualified help.

## Free teaser

- research question
- source route
- search date
- records found/screened/included
- study-type overview
- source titles and links
- relevance explanation
- preliminary synthesis
- preliminary confidence
- missing-data and coverage notice
- partial comparison
- paid contents
- CHF 9.90, one-time, no subscription

## Paid flow

1. Draft report stored.
2. Checkout Session created.
3. Stripe payment.
4. Verified webhook.
5. Processing state.
6. Report generated.
7. Evidence validation.
8. Ready status.
9. Secure browser link.
10. Email.
11. Feedback and issue reporting.

## Failure UX

- clear status
- no stack trace
- browser link remains visible if email fails
- controlled retry
- admin alert
- refund_pending if permanently failed

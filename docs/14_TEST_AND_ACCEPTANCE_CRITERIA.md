# Test and Acceptance Criteria

## Concept

- [ ] concept review completed
- [ ] one question at a time
- [ ] broad-domain strategy confirmed
- [ ] source coverage matrix approved
- [ ] implementation explicitly approved

## Topic UX

- [ ] all initial categories visible
- [ ] example questions work
- [ ] own-question path works
- [ ] domain classification works
- [ ] unsupported domains fail safely
- [ ] health-only bias removed

## Retrieval

- [ ] broad scholarly source works
- [ ] metadata verification works
- [ ] biomedical adapters work where relevant
- [ ] source outages reported
- [ ] deduplication works
- [ ] protocols/retractions handled
- [ ] no Google Scholar scraping
- [ ] no fabricated source

## Eligibility

- [ ] researchability assessed
- [ ] evidence sufficiency assessed
- [ ] expected report depth assessed
- [ ] not-eligible cannot pay
- [ ] restricted high-risk cannot bypass gate
- [ ] limitation reason visible

## Premium report

- [ ] complete required structure
- [ ] verified citations
- [ ] source coverage disclosed
- [ ] comparison usable desktop/mobile
- [ ] detailed profiles
- [ ] synthesis and confidence reasoning
- [ ] uncertainty and limitations
- [ ] practical interpretation remains non-individualized
- [ ] print-friendly
- [ ] visual-reference data not copied as evidence

## Stripe

- [ ] test checkout
- [ ] cancellation
- [ ] webhook signature verification
- [ ] idempotency
- [ ] duplicate event safe
- [ ] redirect alone does not unlock
- [ ] report metadata stored
- [ ] test/live separated
- [ ] manual refund workflow

## Security/privacy

- [ ] no secret in client or repository
- [ ] RLS
- [ ] secure admin
- [ ] hashed report tokens
- [ ] retention enforced
- [ ] raw query not in analytics
- [ ] input warnings
- [ ] rate limits
- [ ] no unresolved critical dependency issue

## Accessibility

- [ ] keyboard usable
- [ ] focus visible
- [ ] async status announced
- [ ] tables have accessible alternative
- [ ] no serious/critical automated violations
- [ ] report prints legibly

## Deployment

- [ ] Vercel preview passes
- [ ] root routes work
- [ ] `tekmesis.com` HTTPS
- [ ] `www` redirect
- [ ] Hostpoint email records preserved
- [ ] Stripe live webhook tested
- [ ] real payment tested
- [ ] AXIA4 site unchanged
- [ ] AXIA4 introduction page links correctly
- [ ] rollback documented

# Deployment – tekmesis.com and AXIA4

## Final architecture

- domain registrar/DNS: Hostpoint
- email: Hostpoint
- application: Vercel
- canonical: `https://tekmesis.com`
- redirect: `https://www.tekmesis.com` → canonical
- AXIA4 remains at Lovable
- `axia4.ch/digital` is a simple external product-introduction page

## DNS

Before change create:
- current records
- proposed records
- rollback records

Use exact values shown by Vercel. Do not guess.

Preserve:
- MX
- SPF
- DKIM
- DMARC
- mail verification records

## Production checks

- root and nested routes
- HTTPS
- `www` redirect
- Stripe live webhook
- report link
- email delivery
- admin auth
- analytics
- DE/EN
- mobile
- privacy/legal
- Hostpoint incoming/outgoing mail
- AXIA4 unchanged

## Rollback

Restore previous website-related DNS records only.
Do not change mail records.

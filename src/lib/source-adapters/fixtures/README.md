# Adapter test fixtures

These JSON files are **hand-authored to match each API's documented response
shape** — they are not recorded live responses. This sandbox's network egress
policy blocks all four scholarly-API hosts (confirmed 2026-07-25: OpenAlex,
Crossref, Europe PMC, and NCBI E-utilities all return a 403 policy denial at
the proxy), so no live capture was possible in this session.

Before Phase 4 is considered fully validated, someone with real network
access (locally, or a Vercel preview) should run each adapter against the
live API at least once and diff the actual response shape against these
fixtures — see `docs/OPEN_RISKS.md`.

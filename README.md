# TEKMESIS

FROM STUDIES TO CLARITY. — an [AXIA4 Digital](https://axia4.ch/digital) product.

Evidence-navigation and premium-report platform: turns a personal question into a
transparent, source-linked evidence report. See `docs/` for the full specification,
concept-review decisions, and implementation plan; start with `docs/STATUS.md` for
current progress.

## Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm run test              # unit
npm run test:integration
npm run test:e2e          # Playwright
npm run test:a11y         # Playwright, @a11y-tagged specs
npm run verify             # lint + typecheck + test + test:integration + build
```

Copy `.env.example` to `.env.local` and fill in credentials as features that need
them are implemented (see `src/lib/env/schema.ts` for what's required vs. optional
at this stage).

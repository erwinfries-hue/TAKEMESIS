import * as Sentry from "@sentry/nextjs";

// Covers middleware.ts and any edge-runtime route handlers. Same
// direct-process.env + fail-open rationale as sentry.server.config.ts.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: 0.2,
});

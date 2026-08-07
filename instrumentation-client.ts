import * as Sentry from "@sentry/nextjs";

// Browser init — Next.js inlines NEXT_PUBLIC_* vars at build time, so this
// is safe to read directly even though the file runs before the rest of the
// client bundle. Same fail-open behavior as the server/edge configs.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.2,
});

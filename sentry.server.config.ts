import * as Sentry from "@sentry/nextjs";

// Read process.env directly, not the app's Zod-validated env modules — this
// file loads during instrumentation registration, before we can guarantee
// the rest of the module graph (and its own env validation, which throws on
// an invalid var) is safe to pull in. Empty/undefined dsn makes the SDK a
// silent no-op (Sentry's own documented behavior), matching this project's
// existing "unset secret -> feature quietly disabled, never a crash" pattern
// used for Stripe/Supabase/PostHog/Resend/Anthropic.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  // Beta-scale traffic — 100% would be free at this volume, but keep it
  // capped so cost/rate stays sane if this is dialed up before revisiting.
  tracesSampleRate: 0.2,
});

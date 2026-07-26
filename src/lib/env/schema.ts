import { z } from "zod";

/**
 * Mirrors docs/.env.example. Vars with a concrete non-empty default in that
 * file are required here; vars left blank there (secrets/provider keys not
 * yet provisioned) stay optional until the feature that consumes them is
 * implemented — that feature's module is responsible for asserting presence
 * at the point of use (e.g. the Stripe client throws if STRIPE_SECRET_KEY is
 * missing when a checkout session is actually created).
 */
const booleanFromString = z
  .string()
  .transform((value) => value === "true")
  .pipe(z.boolean());

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("TEKMESIS"),
  NEXT_PUBLIC_APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_VERSION: z.string().min(1).default("0.1.0"),
  NEXT_PUBLIC_AXIA4_DIGITAL_URL: z.string().url().default("https://axia4.ch/digital"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_ANALYTICS_ENABLED: booleanFromString.default(false),
  NEXT_PUBLIC_ANALYTICS_PROVIDER: z.string().optional(),
  NEXT_PUBLIC_ANALYTICS_SITE_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export const serverEnvSchema = z.object({
  OPENALEX_BASE_URL: z.string().url().default("https://api.openalex.org"),
  CROSSREF_BASE_URL: z.string().url().default("https://api.crossref.org"),
  EUROPE_PMC_BASE_URL: z
    .string()
    .url()
    .default("https://www.ebi.ac.uk/europepmc/webservices/rest"),
  NCBI_EUTILS_BASE_URL: z
    .string()
    .url()
    .default("https://eutils.ncbi.nlm.nih.gov/entrez/eutils"),
  NCBI_API_KEY: z.string().optional(),
  NCBI_TOOL: z.string().min(1).default("TEKMESIS"),
  NCBI_EMAIL: z.string().email().optional(),
  SEMANTIC_SCHOLAR_API_KEY: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  AI_EXTRACTION_ENABLED: booleanFromString.default(false),
  // Cheapest current Claude model by Erwin's explicit choice (2026-07-26) —
  // per-report AI cost matters far more than model capability at this
  // extraction/synthesis task and beta scale (15 users). See
  // docs/ANTHROPIC_API_KEY_ANLEITUNG.md and OPEN_RISKS.md #18.
  AI_MODEL: z.string().min(1).default("claude-haiku-4-5-20251001"),
  AI_MAX_INPUT_CHARS: z.coerce.number().int().positive().default(24000),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
  AI_MAX_RETRIES: z.coerce.number().int().nonnegative().default(2),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_MVP_01: z.string().optional(),
  STRIPE_MODE: z.enum(["test", "live"]).default("test"),
  REPORT_PRICE_MINOR: z.coerce.number().int().positive().default(990),
  REPORT_CURRENCY: z.string().min(1).default("CHF"),
  REPORT_PRICE_VERSION: z.string().min(1).default("MVP-01"),

  EMAIL_PROVIDER: z.string().default("resend"),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  SUPPORT_EMAIL: z.string().email().default("support@tekmesis.com"),

  ADMIN_EMAILS: z.string().optional(),
  ADMIN_AUTH_SECRET: z.string().optional(),

  RATE_LIMIT_SECRET: z.string().optional(),
  LOG_REDACTION_SALT: z.string().optional(),
  FREE_SEARCH_LIMIT: z.coerce.number().int().positive().default(5),

  // Decision #5: 12-month paid-report retention, auto-expiry.
  REPORT_RETENTION_MONTHS: z.coerce.number().int().positive().default(12),
  // Bearer token required on /api/cron/expire-reports so only the scheduler
  // (e.g. Vercel Cron) can trigger it — unset means the route always 401s.
  CRON_SECRET: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

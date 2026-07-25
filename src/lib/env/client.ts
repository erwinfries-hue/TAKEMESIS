import { clientEnvSchema } from "./schema";

/**
 * Each NEXT_PUBLIC_* var is referenced as a literal `process.env.X` member
 * access (not a spread/loop) so Next.js can statically inline it into the
 * client bundle. Safe to import from client components.
 */
const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_BASE_URL: process.env.NEXT_PUBLIC_APP_BASE_URL,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_AXIA4_DIGITAL_URL: process.env.NEXT_PUBLIC_AXIA4_DIGITAL_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
  NEXT_PUBLIC_ANALYTICS_PROVIDER: process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER,
  NEXT_PUBLIC_ANALYTICS_SITE_ID: process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

if (!parsed.success) {
  throw new Error(
    `Invalid client environment variables:\n${parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")}`,
  );
}

export const clientEnv = parsed.data;

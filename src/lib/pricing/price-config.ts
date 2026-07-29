import "server-only";
import { serverEnv } from "@/lib/env/server";

/**
 * Central price configuration (09_MONETIZATION_STRIPE_AND_REPORT_LIFECYCLE.md):
 * one source of truth for the amount/currency/version shown everywhere the
 * price appears, and later stored on each report/payment record. Stripe
 * Price ID wiring itself is Phase 7 — this is the display/config layer.
 */
export interface PriceConfig {
  amountMinor: number;
  currency: string;
  version: string;
}

export function getPriceConfig(): PriceConfig {
  return {
    amountMinor: serverEnv.REPORT_PRICE_MINOR,
    currency: serverEnv.REPORT_CURRENCY,
    version: serverEnv.REPORT_PRICE_VERSION,
  };
}

const PRICE_INTL_LOCALE: Record<"de" | "en" | "fr", string> = {
  de: "de-CH",
  en: "en-CH",
  fr: "fr-CH",
};

export function formatPrice(config: PriceConfig, locale: "de" | "en" | "fr" = "de"): string {
  const amount = config.amountMinor / 100;
  return new Intl.NumberFormat(PRICE_INTL_LOCALE[locale], {
    style: "currency",
    currency: config.currency,
  }).format(amount);
}

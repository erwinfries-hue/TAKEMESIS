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

export function formatPrice(config: PriceConfig, locale: "de" | "en" = "de"): string {
  const amount = config.amountMinor / 100;
  return new Intl.NumberFormat(locale === "de" ? "de-CH" : "en-CH", {
    style: "currency",
    currency: config.currency,
  }).format(amount);
}

import "server-only";
import type Stripe from "stripe";
import { getStripeClient } from "./client";
import { serverEnv } from "@/lib/env/server";
import { clientEnv } from "@/lib/env/client";
import type { Locale } from "@/lib/i18n/config";

export interface CreateCheckoutSessionParams {
  reportId: string;
  /** Raw report token — never persisted (docs/10: "secure hashed report tokens"); flows through Stripe's own metadata storage so the webhook can build the "ready" email's report link without us ever storing it ourselves. */
  reportToken: string;
  priceVersion: string;
  amountMinor: number;
  currency: string;
  locale: Locale;
}

/**
 * Shown on the buyer's card statement (max 22 characters, letters/digits/
 * spaces only per card-network rules) — set per-session rather than as the
 * Stripe account's default, since the same account is also used for an
 * unrelated project (Erwin's explicit choice, 2026-07-28: one Stripe
 * account, revenue kept distinguishable via the `project` metadata below
 * rather than a second account).
 */
const STATEMENT_DESCRIPTOR = "AXIA4 EF TEKMESIS";

/** Minimal slice of the Stripe SDK this module needs — lets tests pass a fake client instead of constructing a real one (which requires STRIPE_SECRET_KEY). */
export interface CheckoutCapableStripeClient {
  checkout: {
    sessions: {
      create: Stripe.Checkout.SessionResource["create"];
    };
  };
}

/**
 * Creates the Checkout Session server-side (docs/09: "server-created
 * Checkout Session", "report ID and price version in metadata"). Prefers a
 * pre-created Stripe Price (STRIPE_PRICE_ID_MVP_01) when configured — the
 * documented production path — and falls back to inline price_data using
 * our own price config for local development before that Price exists in
 * the Stripe dashboard.
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
  stripeClient: CheckoutCapableStripeClient = getStripeClient(),
): Promise<Stripe.Checkout.Session> {
  const baseUrl = clientEnv.NEXT_PUBLIC_APP_BASE_URL;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = serverEnv.STRIPE_PRICE_ID_MVP_01
    ? [{ price: serverEnv.STRIPE_PRICE_ID_MVP_01, quantity: 1 }]
    : [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: { name: "TEKMESIS Premium Evidence Report" },
            unit_amount: params.amountMinor,
          },
          quantity: 1,
        },
      ];

  return stripeClient.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    metadata: {
      reportId: params.reportId,
      priceVersion: params.priceVersion,
      // Lets Erwin filter/export TEKMESIS revenue separately from other
      // projects sharing this Stripe account in the Dashboard (2026-07-28
      // decision — metadata-based separation, not a second account).
      project: "tekmesis",
      reportToken: params.reportToken,
    },
    payment_intent_data: {
      statement_descriptor: STATEMENT_DESCRIPTOR,
    },
    // Lets Stripe show its own "gift/discount code" field on the Checkout
    // page — no custom code-validation logic needed. Codes themselves are
    // created and managed in the Stripe Dashboard (Erwin's side, once a
    // real account exists); nothing here invents or hardcodes a discount.
    allow_promotion_codes: true,
    success_url: `${baseUrl}/checkout/success?report=${params.reportId}&token=${params.reportToken}`,
    cancel_url: `${baseUrl}/checkout/cancel?report=${params.reportId}`,
    locale: params.locale,
  });
}

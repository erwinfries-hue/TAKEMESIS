import { describe, expect, it, vi } from "vitest";
import { createCheckoutSession, type CheckoutCapableStripeClient } from "./checkout";

function fakeStripeClient(sessionId = "cs_test_123") {
  const create = vi.fn().mockResolvedValue({ id: sessionId, url: `https://checkout.stripe.com/${sessionId}` });
  const client: CheckoutCapableStripeClient = { checkout: { sessions: { create } } };
  return { client, create };
}

const BASE_PARAMS = {
  reportId: "report-1",
  reportToken: "raw-token-abc",
  priceVersion: "MVP-01",
  amountMinor: 990,
  currency: "CHF",
  locale: "de" as const,
};

describe("createCheckoutSession", () => {
  it("includes the report ID, price version, project tag, and report token in metadata (docs/09)", async () => {
    const { client, create } = fakeStripeClient();
    await createCheckoutSession(BASE_PARAMS, client);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          reportId: "report-1",
          priceVersion: "MVP-01",
          project: "tekmesis",
          reportToken: "raw-token-abc",
        },
      }),
    );
  });

  it("sets a statement descriptor within the 22-character card-network limit", async () => {
    const { client, create } = fakeStripeClient();
    await createCheckoutSession(BASE_PARAMS, client);
    const call = create.mock.calls[0][0];
    expect(call.payment_intent_data.statement_descriptor.length).toBeLessThanOrEqual(22);
    expect(call.payment_intent_data.statement_descriptor).toBe("AXIA4 EF TEKMESIS");
  });

  it("creates a one-time payment session, not a subscription", async () => {
    const { client, create } = fakeStripeClient();
    await createCheckoutSession(BASE_PARAMS, client);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ mode: "payment" }));
  });

  it("falls back to inline price_data using our own amount/currency when no Stripe Price ID is configured", async () => {
    const { client, create } = fakeStripeClient();
    await createCheckoutSession(BASE_PARAMS, client);
    const call = create.mock.calls[0][0];
    expect(call.line_items[0].price_data).toMatchObject({ currency: "chf", unit_amount: 990 });
  });

  it("allows Stripe's built-in promotion/gift codes on the checkout page", async () => {
    const { client, create } = fakeStripeClient();
    await createCheckoutSession(BASE_PARAMS, client);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ allow_promotion_codes: true }));
  });

  it("points success/cancel URLs at the app base URL with the report ID, success URL also carrying the raw token", async () => {
    const { client, create } = fakeStripeClient();
    await createCheckoutSession({ ...BASE_PARAMS, reportId: "report-42", locale: "en" }, client);
    const call = create.mock.calls[0][0];
    expect(call.success_url).toContain("/checkout/success?report=report-42");
    expect(call.success_url).toContain("token=raw-token-abc");
    expect(call.cancel_url).toContain("/checkout/cancel?report=report-42");
  });

  it("returns the created session", async () => {
    const { client } = fakeStripeClient("cs_test_abc");
    const session = await createCheckoutSession(BASE_PARAMS, client);
    expect(session.id).toBe("cs_test_abc");
  });
});

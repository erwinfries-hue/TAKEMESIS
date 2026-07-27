import { describe, expect, it, vi } from "vitest";
import { createCheckoutSession, type CheckoutCapableStripeClient } from "./checkout";

function fakeStripeClient(sessionId = "cs_test_123") {
  const create = vi.fn().mockResolvedValue({ id: sessionId, url: `https://checkout.stripe.com/${sessionId}` });
  const client: CheckoutCapableStripeClient = { checkout: { sessions: { create } } };
  return { client, create };
}

describe("createCheckoutSession", () => {
  it("includes the report ID and price version in metadata (docs/09)", async () => {
    const { client, create } = fakeStripeClient();
    await createCheckoutSession(
      { reportId: "report-1", priceVersion: "MVP-01", amountMinor: 990, currency: "CHF", locale: "de" },
      client,
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { reportId: "report-1", priceVersion: "MVP-01" },
      }),
    );
  });

  it("creates a one-time payment session, not a subscription", async () => {
    const { client, create } = fakeStripeClient();
    await createCheckoutSession(
      { reportId: "report-1", priceVersion: "MVP-01", amountMinor: 990, currency: "CHF", locale: "de" },
      client,
    );
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ mode: "payment" }));
  });

  it("falls back to inline price_data using our own amount/currency when no Stripe Price ID is configured", async () => {
    const { client, create } = fakeStripeClient();
    await createCheckoutSession(
      { reportId: "report-1", priceVersion: "MVP-01", amountMinor: 990, currency: "CHF", locale: "de" },
      client,
    );
    const call = create.mock.calls[0][0];
    expect(call.line_items[0].price_data).toMatchObject({ currency: "chf", unit_amount: 990 });
  });

  it("allows Stripe's built-in promotion/gift codes on the checkout page", async () => {
    const { client, create } = fakeStripeClient();
    await createCheckoutSession(
      { reportId: "report-1", priceVersion: "MVP-01", amountMinor: 990, currency: "CHF", locale: "de" },
      client,
    );
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ allow_promotion_codes: true }));
  });

  it("points success/cancel URLs at the app base URL with the report ID", async () => {
    const { client, create } = fakeStripeClient();
    await createCheckoutSession(
      { reportId: "report-42", priceVersion: "MVP-01", amountMinor: 990, currency: "CHF", locale: "en" },
      client,
    );
    const call = create.mock.calls[0][0];
    expect(call.success_url).toContain("/checkout/success?report=report-42");
    expect(call.cancel_url).toContain("/checkout/cancel?report=report-42");
  });

  it("returns the created session", async () => {
    const { client } = fakeStripeClient("cs_test_abc");
    const session = await createCheckoutSession(
      { reportId: "report-1", priceVersion: "MVP-01", amountMinor: 990, currency: "CHF", locale: "de" },
      client,
    );
    expect(session.id).toBe("cs_test_abc");
  });
});

import "server-only";
import { verifyWebhookSignature, processStripeEvent, type FulfillmentDeps } from "./webhook";
import { SupabaseReportRepository } from "@/lib/reports/supabase-report-repository";
import { SupabasePaymentRepository } from "@/lib/payments/supabase-payment-repository";
import { SupabaseWebhookEventRepository } from "@/lib/payments/supabase-webhook-event-repository";

function defaultDeps(): FulfillmentDeps {
  return {
    reportRepository: new SupabaseReportRepository(),
    paymentRepository: new SupabasePaymentRepository(),
    webhookEventRepository: new SupabaseWebhookEventRepository(),
  };
}

/**
 * Core logic behind POST /api/stripe/webhook, factored out so it's testable
 * with fake repositories (the route handler itself just calls this with the
 * default Supabase-backed deps). Reads the raw request body — never
 * request.json() first — since Stripe signs the exact bytes sent.
 */
export async function handleStripeWebhookRequest(
  request: Request,
  deps: FulfillmentDeps = defaultDeps(),
): Promise<Response> {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = verifyWebhookSignature(rawBody, signature);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    const result = await processStripeEvent(event, deps);
    return Response.json({ received: true, processed: result.processed });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return Response.json({ error: "processing failed" }, { status: 500 });
  }
}

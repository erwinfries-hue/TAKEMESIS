import { handleStripeWebhookRequest } from "@/lib/stripe/webhook-route-handler";

// Fulfillment runs the real live search + AI extraction/synthesis
// synchronously before responding to Stripe (see webhook.ts's
// fulfillCheckoutSession -> generateReportContent) — the same chain that
// needs maxDuration = 60 on /admin/report-preview, for the same reason:
// well past a default 10s serverless budget. Without this, Vercel can kill
// the function mid-fulfillment, after the webhook event is already recorded
// as seen but before markProcessed() — leaving a paid report stuck with no
// automatic retry path (see OPEN_RISKS.md).
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  return handleStripeWebhookRequest(request);
}

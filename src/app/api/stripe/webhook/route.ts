import { handleStripeWebhookRequest } from "@/lib/stripe/webhook-route-handler";

export async function POST(request: Request): Promise<Response> {
  return handleStripeWebhookRequest(request);
}

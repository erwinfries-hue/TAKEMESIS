import { handleResendConfirmationEmailsRequest } from "@/lib/reports/resend-confirmation-emails-route-handler";

// Retrieving each due report's Stripe Checkout Session and sending its
// email is comfortably fast per-report, but this scales with however many
// reports are due on a given day — same reasoning as
// /api/stripe/webhook's maxDuration, just a wider budget since this can
// process a whole day's worth of misses in one run.
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  return handleResendConfirmationEmailsRequest(request);
}

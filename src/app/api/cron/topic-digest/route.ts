import { handleTopicDigestRequest } from "@/lib/topics/topic-digest-route-handler";

// Content is a Supabase read per subscribed topic plus one email send per
// due subscription — comfortably fast per-subscription, but scales with
// however many subscriptions have new studies waiting on a given week, same
// reasoning as the other two cron routes' maxDuration.
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  return handleTopicDigestRequest(request);
}

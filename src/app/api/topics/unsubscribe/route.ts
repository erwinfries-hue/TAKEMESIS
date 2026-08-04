import { handleTopicUnsubscribeRequest } from "@/lib/topics/topic-unsubscribe-route-handler";

export async function GET(request: Request): Promise<Response> {
  return handleTopicUnsubscribeRequest(request);
}

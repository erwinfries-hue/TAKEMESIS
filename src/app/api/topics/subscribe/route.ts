import { handleTopicSubscribeRequest } from "@/lib/topics/topic-subscribe-route-handler";

export async function POST(request: Request): Promise<Response> {
  return handleTopicSubscribeRequest(request);
}

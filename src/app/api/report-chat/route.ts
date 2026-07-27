import { handleReportChatRequest } from "@/lib/ai/report-chat-route-handler";

export async function POST(request: Request): Promise<Response> {
  return handleReportChatRequest(request);
}

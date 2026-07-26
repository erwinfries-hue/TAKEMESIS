import { handleExpireReportsRequest } from "@/lib/reports/expire-reports-route-handler";

export async function GET(request: Request): Promise<Response> {
  return handleExpireReportsRequest(request);
}

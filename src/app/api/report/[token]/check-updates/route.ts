import { handleCheckUpdatesRequest } from "@/lib/reports/check-updates-route-handler";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  return handleCheckUpdatesRequest(token);
}

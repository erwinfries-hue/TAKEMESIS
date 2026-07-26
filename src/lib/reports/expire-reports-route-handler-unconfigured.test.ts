import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { CRON_SECRET: undefined },
}));

import { handleExpireReportsRequest } from "./expire-reports-route-handler";
import { InMemoryReportRepository } from "./in-memory-report-repository";

describe("handleExpireReportsRequest (CRON_SECRET unset)", () => {
  it("always returns 401, even with an Authorization header, so the route is safe to deploy before provisioning", async () => {
    const request = new Request("http://localhost/api/cron/expire-reports", {
      headers: { authorization: "Bearer anything" },
    });
    const response = await handleExpireReportsRequest(request, new InMemoryReportRepository());
    expect(response.status).toBe(401);
  });
});

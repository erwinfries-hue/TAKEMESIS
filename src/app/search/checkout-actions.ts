"use server";

import { redirect } from "next/navigation";
import { SupabaseReportRepository } from "@/lib/reports/supabase-report-repository";
import { startCheckoutForReport } from "@/lib/checkout/start-checkout";

export async function startCheckoutAction(formData: FormData): Promise<void> {
  const reportId = formData.get("reportId");
  const reportToken = formData.get("reportToken");
  if (typeof reportId !== "string" || reportId.length === 0) {
    throw new Error("Missing reportId");
  }
  if (typeof reportToken !== "string" || reportToken.length === 0) {
    throw new Error("Missing reportToken");
  }

  const { url } = await startCheckoutForReport(
    { reportRepository: new SupabaseReportRepository() },
    reportId,
    reportToken,
  );
  redirect(url);
}

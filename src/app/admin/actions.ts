"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/require-admin-session";
import { SupabaseReportRepository } from "@/lib/reports/supabase-report-repository";
import { SupabaseAuditLogRepository } from "@/lib/admin/supabase-audit-log-repository";
import {
  blockReport,
  markRefundPending,
  recordRefunded,
  retryReport,
  revokeReport,
  type AdminActionDeps,
} from "@/lib/admin/report-actions";

async function actionDeps(): Promise<AdminActionDeps> {
  const adminEmail = await requireAdminSession();
  return {
    reportRepository: new SupabaseReportRepository(),
    auditLogRepository: new SupabaseAuditLogRepository(),
    adminEmail,
  };
}

function reportIdFrom(formData: FormData): string {
  const reportId = formData.get("reportId");
  if (typeof reportId !== "string" || reportId.length === 0) {
    throw new Error("Missing reportId");
  }
  return reportId;
}

export async function revokeReportAction(formData: FormData): Promise<void> {
  const deps = await actionDeps();
  await revokeReport(deps, reportIdFrom(formData));
  revalidatePath("/admin");
}

export async function blockReportAction(formData: FormData): Promise<void> {
  const deps = await actionDeps();
  await blockReport(deps, reportIdFrom(formData));
  revalidatePath("/admin");
}

export async function markRefundPendingAction(formData: FormData): Promise<void> {
  const deps = await actionDeps();
  await markRefundPending(deps, reportIdFrom(formData));
  revalidatePath("/admin");
}

export async function recordRefundedAction(formData: FormData): Promise<void> {
  const deps = await actionDeps();
  await recordRefunded(deps, reportIdFrom(formData));
  revalidatePath("/admin");
}

export async function retryReportAction(formData: FormData): Promise<void> {
  const deps = await actionDeps();
  await retryReport(deps, reportIdFrom(formData));
  revalidatePath("/admin");
}

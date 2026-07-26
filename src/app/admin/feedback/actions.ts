"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/require-admin-session";
import { SupabaseIssueReportRepository } from "@/lib/feedback/supabase-issue-report-repository";
import { SupabaseAuditLogRepository } from "@/lib/admin/supabase-audit-log-repository";
import { dismissIssue, resolveIssue, type IssueActionDeps } from "@/lib/admin/issue-actions";

async function actionDeps(): Promise<IssueActionDeps> {
  const adminEmail = await requireAdminSession();
  return {
    issueReportRepository: new SupabaseIssueReportRepository(),
    auditLogRepository: new SupabaseAuditLogRepository(),
    adminEmail,
  };
}

function issueIdFrom(formData: FormData): string {
  const issueId = formData.get("issueId");
  if (typeof issueId !== "string" || issueId.length === 0) {
    throw new Error("Missing issueId");
  }
  return issueId;
}

export async function resolveIssueAction(formData: FormData): Promise<void> {
  const deps = await actionDeps();
  await resolveIssue(deps, issueIdFrom(formData));
  revalidatePath("/admin/feedback");
}

export async function dismissIssueAction(formData: FormData): Promise<void> {
  const deps = await actionDeps();
  await dismissIssue(deps, issueIdFrom(formData));
  revalidatePath("/admin/feedback");
}

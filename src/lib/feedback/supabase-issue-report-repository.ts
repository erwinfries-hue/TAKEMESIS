import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { IssueReportRepository } from "./issue-report-repository";
import type { CreateIssueReportInput, IssueReport, IssueStatus } from "./types";

/** Untested against a live database — no Supabase project provisioned in this session, same status as the other Supabase repositories (see docs/OPEN_RISKS.md #13). */
interface IssueReportRow {
  id: string;
  report_id: string | null;
  category: string | null;
  description: string;
  status: IssueStatus;
  created_at: string;
}

function toDomain(row: IssueReportRow): IssueReport {
  return {
    id: row.id,
    reportId: row.report_id,
    category: row.category,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
  };
}

export class SupabaseIssueReportRepository implements IssueReportRepository {
  async create(input: CreateIssueReportInput): Promise<IssueReport> {
    const { data, error } = await getSupabaseClient()
      .from("issue_reports")
      .insert({
        report_id: input.reportId,
        category: input.category,
        description: input.description,
      })
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as IssueReportRow);
  }

  async updateStatus(id: string, status: IssueStatus): Promise<IssueReport> {
    const { data, error } = await getSupabaseClient()
      .from("issue_reports")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as IssueReportRow);
  }

  async listAll(): Promise<IssueReport[]> {
    const { data, error } = await getSupabaseClient()
      .from("issue_reports")
      .select()
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as IssueReportRow[]).map(toDomain);
  }
}

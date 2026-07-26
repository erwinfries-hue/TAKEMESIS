import "server-only";
import { getSupabaseClient } from "@/lib/db/supabase-client";
import type { AuditLogEntry, AuditLogRepository, RecordAuditLogInput } from "./audit-log-repository";

/** Untested against a live database — see the same note in supabase-report-repository.ts. */
interface AuditLogRow {
  id: string;
  admin_email: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function toDomain(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    adminEmail: row.admin_email,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export class SupabaseAuditLogRepository implements AuditLogRepository {
  async record(input: RecordAuditLogInput): Promise<AuditLogEntry> {
    const { data, error } = await getSupabaseClient()
      .from("admin_audit_log")
      .insert({
        admin_email: input.adminEmail,
        action: input.action,
        target_type: input.targetType ?? null,
        target_id: input.targetId ?? null,
        metadata: input.metadata ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return toDomain(data as AuditLogRow);
  }

  async listRecent(limit = 50): Promise<AuditLogEntry[]> {
    const { data, error } = await getSupabaseClient()
      .from("admin_audit_log")
      .select()
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as AuditLogRow[]).map(toDomain);
  }
}

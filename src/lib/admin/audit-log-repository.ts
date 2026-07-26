export interface AuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface RecordAuditLogInput {
  adminEmail: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditLogRepository {
  record(input: RecordAuditLogInput): Promise<AuditLogEntry>;
  listRecent(limit?: number): Promise<AuditLogEntry[]>;
}

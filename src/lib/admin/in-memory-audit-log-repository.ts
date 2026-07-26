import { randomUUID } from "node:crypto";
import type { AuditLogEntry, AuditLogRepository, RecordAuditLogInput } from "./audit-log-repository";

export class InMemoryAuditLogRepository implements AuditLogRepository {
  private readonly entries: AuditLogEntry[] = [];

  async record(input: RecordAuditLogInput): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: randomUUID(),
      adminEmail: input.adminEmail,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? null,
      createdAt: new Date().toISOString(),
    };
    this.entries.unshift(entry);
    return entry;
  }

  async listRecent(limit = 50): Promise<AuditLogEntry[]> {
    return this.entries.slice(0, limit);
  }
}

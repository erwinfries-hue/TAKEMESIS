import type { CreateReportInput, Report } from "./types";

export interface ReportRepository {
  create(input: CreateReportInput): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  findByTokenHash(tokenHash: string): Promise<Report | null>;
  findByCheckoutSessionId(sessionId: string): Promise<Report | null>;
  update(id: string, patch: Partial<Omit<Report, "id" | "createdAt">>): Promise<Report>;
}

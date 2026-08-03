import { randomUUID } from "node:crypto";
import type { ReportRepository } from "./report-repository";
import type { CreateReportInput, Report } from "./types";

/** In-process implementation for tests and local development without a database. */
export class InMemoryReportRepository implements ReportRepository {
  private readonly reports = new Map<string, Report>();

  async create(input: CreateReportInput): Promise<Report> {
    const now = new Date().toISOString();
    const report: Report = {
      id: randomUUID(),
      tokenHash: input.tokenHash,
      status: "draft",
      eligibility: input.eligibility,
      domainSlug: input.domainSlug,
      originalQuestion: input.originalQuestion,
      interpretedQuestion: null,
      locale: input.locale,
      sourceRoute: input.sourceRoute,
      searchStats: input.searchStats,
      previewPayload: input.previewPayload,
      finalPayload: null,
      reportVersion: null,
      priceVersion: input.priceVersion,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      email: null,
      createdAt: now,
      updatedAt: now,
      expiresAt: null,
      revokedAt: null,
      failureCode: null,
      confirmationEmailSentAt: null,
      lastUpdateCheckAt: null,
    };
    this.reports.set(report.id, report);
    return report;
  }

  async findById(id: string): Promise<Report | null> {
    return this.reports.get(id) ?? null;
  }

  async findByTokenHash(tokenHash: string): Promise<Report | null> {
    for (const report of this.reports.values()) {
      if (report.tokenHash === tokenHash) {
        return report;
      }
    }
    return null;
  }

  async findByCheckoutSessionId(sessionId: string): Promise<Report | null> {
    for (const report of this.reports.values()) {
      if (report.stripeCheckoutSessionId === sessionId) {
        return report;
      }
    }
    return null;
  }

  async update(id: string, patch: Partial<Omit<Report, "id" | "createdAt">>): Promise<Report> {
    const existing = this.reports.get(id);
    if (!existing) {
      throw new Error(`Report ${id} not found`);
    }
    const updated: Report = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.reports.set(id, updated);
    return updated;
  }

  async listAll(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

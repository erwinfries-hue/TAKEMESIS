import { randomUUID } from "node:crypto";
import type { IssueReportRepository } from "./issue-report-repository";
import type { CreateIssueReportInput, IssueReport, IssueStatus } from "./types";

export class InMemoryIssueReportRepository implements IssueReportRepository {
  private readonly issues: IssueReport[] = [];

  async create(input: CreateIssueReportInput): Promise<IssueReport> {
    const issue: IssueReport = {
      id: randomUUID(),
      reportId: input.reportId,
      category: input.category,
      description: input.description,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    this.issues.unshift(issue);
    return issue;
  }

  async updateStatus(id: string, status: IssueStatus): Promise<IssueReport> {
    const issue = this.issues.find((i) => i.id === id);
    if (!issue) {
      throw new Error(`Issue report not found: ${id}`);
    }
    issue.status = status;
    return issue;
  }

  async listAll(): Promise<IssueReport[]> {
    return [...this.issues];
  }
}

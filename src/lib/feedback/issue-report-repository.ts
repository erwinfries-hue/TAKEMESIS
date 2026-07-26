import type { CreateIssueReportInput, IssueReport, IssueStatus } from "./types";

export interface IssueReportRepository {
  create(input: CreateIssueReportInput): Promise<IssueReport>;
  updateStatus(id: string, status: IssueStatus): Promise<IssueReport>;
  listAll(): Promise<IssueReport[]>;
}

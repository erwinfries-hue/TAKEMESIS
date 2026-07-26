export interface FeedbackEntry {
  id: string;
  reportId: string | null;
  rating: number | null;
  comment: string | null;
  createdAt: string;
}

export interface CreateFeedbackInput {
  reportId: string | null;
  rating: number | null;
  comment: string | null;
}

export type IssueStatus = "open" | "resolved" | "dismissed";

export interface IssueReport {
  id: string;
  reportId: string | null;
  category: string | null;
  description: string;
  status: IssueStatus;
  createdAt: string;
}

export interface CreateIssueReportInput {
  reportId: string | null;
  category: string | null;
  description: string;
}

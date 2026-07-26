import type { CreateFeedbackInput, FeedbackEntry } from "./types";

export interface FeedbackRepository {
  create(input: CreateFeedbackInput): Promise<FeedbackEntry>;
  listAll(): Promise<FeedbackEntry[]>;
}

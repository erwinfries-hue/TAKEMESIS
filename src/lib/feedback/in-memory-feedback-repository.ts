import { randomUUID } from "node:crypto";
import type { FeedbackRepository } from "./feedback-repository";
import type { CreateFeedbackInput, FeedbackEntry } from "./types";

export class InMemoryFeedbackRepository implements FeedbackRepository {
  private readonly entries: FeedbackEntry[] = [];

  async create(input: CreateFeedbackInput): Promise<FeedbackEntry> {
    const entry: FeedbackEntry = {
      id: randomUUID(),
      reportId: input.reportId,
      rating: input.rating,
      comment: input.comment,
      createdAt: new Date().toISOString(),
    };
    this.entries.unshift(entry);
    return entry;
  }

  async listAll(): Promise<FeedbackEntry[]> {
    return [...this.entries];
  }
}

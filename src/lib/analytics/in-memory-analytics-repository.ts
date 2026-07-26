import type { AnalyticsEventInput, AnalyticsEventRepository } from "./analytics-repository";

export class InMemoryAnalyticsRepository implements AnalyticsEventRepository {
  readonly events: AnalyticsEventInput[] = [];

  async record(input: AnalyticsEventInput): Promise<void> {
    this.events.push(input);
  }
}

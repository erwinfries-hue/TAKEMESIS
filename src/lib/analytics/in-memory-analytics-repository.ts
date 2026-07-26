import type { AnalyticsEventName } from "./events";
import type { AnalyticsEventInput, AnalyticsEventRepository } from "./analytics-repository";

export class InMemoryAnalyticsRepository implements AnalyticsEventRepository {
  readonly events: AnalyticsEventInput[] = [];

  async record(input: AnalyticsEventInput): Promise<void> {
    this.events.push(input);
  }

  async countByEventAndDomain(eventName: AnalyticsEventName, domainSlug: string): Promise<number> {
    return this.events.filter(
      (event) => event.eventName === eventName && event.metadata.domainSlug === domainSlug,
    ).length;
  }
}

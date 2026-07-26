import type { AnalyticsEventName } from "./events";
import type { AnalyticsEventInput, AnalyticsEventRepository } from "./analytics-repository";

export class InMemoryAnalyticsRepository implements AnalyticsEventRepository {
  private readonly records: Array<{ input: AnalyticsEventInput; recordedAt: Date }> = [];

  /** Read-only view matching the pre-existing public shape (tests read this directly). */
  get events(): AnalyticsEventInput[] {
    return this.records.map((r) => r.input);
  }

  async record(input: AnalyticsEventInput): Promise<void> {
    this.records.push({ input, recordedAt: new Date() });
  }

  async countByEventAndDomain(eventName: AnalyticsEventName, domainSlug: string): Promise<number> {
    return this.records.filter(
      (r) => r.input.eventName === eventName && r.input.metadata.domainSlug === domainSlug,
    ).length;
  }

  async countByEventAndDomainSince(
    eventName: AnalyticsEventName,
    domainSlug: string,
    since: Date,
  ): Promise<number> {
    return this.records.filter(
      (r) =>
        r.input.eventName === eventName &&
        r.input.metadata.domainSlug === domainSlug &&
        r.recordedAt >= since,
    ).length;
  }
}

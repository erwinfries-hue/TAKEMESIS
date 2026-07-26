import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { topics, topicCopy } from "@/content/topics";
import { ExampleQuestionChip } from "@/components/example-question-chip";
import { OwnQuestionForm } from "@/components/own-question-form";
import { TopicIcon } from "@/components/icons/topic-icons";
import { getAskedCountForDomain } from "@/lib/analytics/social-proof";
import { getTrendingTopics } from "@/lib/analytics/trending-topics";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.topicsPage.heading} — ${dict.brand.name}` };
}

export default async function TopicsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const askedCounts = await Promise.all(
    topics.map(async (topic) => [topic.slug, await getAskedCountForDomain(topic.slug)] as const),
  );
  const askedCountBySlug = new Map(askedCounts);
  const trendingTopics = await getTrendingTopics(topics.map((topic) => topic.slug));
  const trendingWithCopy = trendingTopics
    .map((trending) => {
      const topic = topics.find((t) => t.slug === trending.domainSlug);
      return topic ? { topic, copy: topicCopy(topic, locale), count: trending.count } : null;
    })
    .filter((entry) => entry !== null);

  return (
    <main className="flex flex-1 flex-col items-center gap-12 px-6 py-16 sm:px-10">
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold text-brand-navy-900">
          {dict.topicsPage.heading}
        </h1>
        <p className="text-brand-neutral-600">{dict.topicsPage.intro}</p>
      </div>

      {trendingWithCopy.length > 0 && (
        <div className="flex w-full max-w-2xl flex-col items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-neutral-600">
            {dict.topicsPage.trendingHeading}
          </h2>
          <ul className="flex flex-wrap justify-center gap-2">
            {trendingWithCopy.map((entry) => (
              <li key={entry.topic.slug}>
                <a
                  href={`#${entry.topic.slug}`}
                  className="flex items-center gap-2 rounded-full border border-brand-teal-600 bg-brand-teal-100 px-4 py-2 text-sm font-medium text-brand-teal-700 hover:bg-brand-teal-600 hover:text-white"
                >
                  {entry.copy.name}
                  <span className="text-xs font-normal">
                    {dict.topicsPage.trendingCountLabel.replace("{count}", String(entry.count))}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Suspense>
        <OwnQuestionForm dict={dict} locale={locale} id="eigene-frage" />
      </Suspense>

      <div className="flex w-full max-w-4xl flex-col gap-8">
        {topics.map((topic) => {
          const copy = topicCopy(topic, locale);
          const askedCount = askedCountBySlug.get(topic.slug);
          return (
            <article
              key={topic.slug}
              id={topic.slug}
              className="scroll-mt-20 rounded-xl border border-brand-neutral-200 bg-white p-6"
            >
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <TopicIcon slug={topic.slug} className="h-6 w-6 shrink-0 text-brand-teal-600" />
                <h2 className="text-xl font-semibold text-brand-navy-900">{copy.name}</h2>
                {askedCount != null && (
                  <span className="rounded-full bg-brand-teal-100 px-2 py-0.5 text-xs font-medium text-brand-teal-700">
                    {dict.topicsPage.askedCountLabel.replace("{count}", String(askedCount))}
                  </span>
                )}
                {topic.riskProfile === "elevated" && (
                  <span className="rounded-full bg-brand-warning-100 px-2 py-0.5 text-xs font-medium text-brand-warning-600">
                    {dict.topicsPage.elevatedRiskBadge}
                  </span>
                )}
              </div>
              <p className="mb-4 text-brand-neutral-600">{copy.description}</p>

              <h3 className="mb-2 text-sm font-semibold text-brand-neutral-950">
                {dict.topicsPage.examplesHeading}
              </h3>
              <div className="mb-4 flex flex-wrap gap-2">
                {copy.examples.map((example) => (
                  <ExampleQuestionChip key={example} question={example} />
                ))}
              </div>

              <h3 className="mb-1 text-sm font-semibold text-brand-neutral-950">
                {dict.topicsPage.limitationsHeading}
              </h3>
              <p className="mb-4 text-sm text-brand-neutral-600">{copy.limitations}</p>

              <h3 className="mb-1 text-sm font-semibold text-brand-neutral-950">
                {dict.topicsPage.sourceRouteHeading}
              </h3>
              <p className="text-sm text-brand-neutral-600">{topic.sourceRoute}</p>
            </article>
          );
        })}
      </div>
    </main>
  );
}

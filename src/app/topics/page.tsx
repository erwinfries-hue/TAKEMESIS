import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { topics, topicCopy } from "@/content/topics";
import { ExampleQuestionChip } from "@/components/example-question-chip";
import { OwnQuestionForm } from "@/components/own-question-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.topicsPage.heading} — ${dict.brand.name}` };
}

export default async function TopicsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col items-center gap-12 px-6 py-16 sm:px-10">
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold text-brand-navy-900">
          {dict.topicsPage.heading}
        </h1>
        <p className="text-brand-neutral-600">{dict.topicsPage.intro}</p>
      </div>

      <Suspense>
        <OwnQuestionForm dict={dict} id="eigene-frage" />
      </Suspense>

      <div className="flex w-full max-w-4xl flex-col gap-8">
        {topics.map((topic) => {
          const copy = topicCopy(topic, locale);
          return (
            <article
              key={topic.slug}
              id={topic.slug}
              className="scroll-mt-20 rounded-xl border border-brand-neutral-200 bg-white p-6"
            >
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-brand-navy-900">{copy.name}</h2>
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

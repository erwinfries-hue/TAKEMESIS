import Link from "next/link";
import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { topics, topicCopy } from "@/content/topics";
import { TopicCard } from "@/components/topic-card";
import { OwnQuestionForm } from "@/components/own-question-form";

const TEASER_COUNT = 6;

export default async function Home() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const teaserTopics = topics.slice(0, TEASER_COUNT);

  return (
    <main className="flex flex-1 flex-col">
      {/* 1. Brand and promise */}
      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-10">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-teal-700">
          {dict.brand.claim}
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-brand-navy-900 sm:text-4xl">
          {dict.home.description}
        </h1>
        <p className="text-brand-neutral-600">{dict.home.comingSoon}</p>
        <Link
          href="/topics"
          className="rounded-full bg-brand-navy-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
        >
          {dict.home.heroCta}
        </Link>
      </section>

      {/* 2. Topic-category inspiration grid */}
      <section className="flex flex-col items-center gap-6 border-t border-brand-neutral-200 bg-white px-6 py-16 sm:px-10">
        <h2 className="text-2xl font-semibold text-brand-navy-900">
          {dict.home.topicsTeaserHeading}
        </h2>
        <p className="max-w-xl text-center text-brand-neutral-600">
          {dict.home.topicsTeaserIntro}
        </p>
        <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teaserTopics.map((topic) => (
            <TopicCard
              key={topic.slug}
              topic={topic}
              copy={topicCopy(topic, locale)}
              elevatedRiskLabel={dict.topicsPage.elevatedRiskBadge}
            />
          ))}
        </div>
        <Link href="/topics" className="font-medium text-brand-teal-700 hover:underline">
          {dict.home.topicsTeaserCta} →
        </Link>
      </section>

      {/* 3. Own-question input */}
      <section
        id="eigene-frage"
        className="flex flex-col items-center gap-6 border-t border-brand-neutral-200 px-6 py-16 sm:px-10"
      >
        <Suspense>
          <OwnQuestionForm dict={dict} />
        </Suspense>
      </section>

      {/* 4. Curated example-report preview */}
      <section className="flex flex-col items-center gap-4 border-t border-brand-neutral-200 bg-white px-6 py-16 text-center sm:px-10">
        <h2 className="text-2xl font-semibold text-brand-navy-900">
          {dict.exampleReportPage.heading}
        </h2>
        <p className="max-w-xl text-brand-neutral-600">
          {dict.exampleReportPage.topicQuestion}
        </p>
        <Link href="/example-report" className="font-medium text-brand-teal-700 hover:underline">
          {dict.exampleReportPage.heading} →
        </Link>
      </section>

      {/* 5. How it works */}
      <section className="flex flex-col items-center gap-6 border-t border-brand-neutral-200 px-6 py-16 sm:px-10">
        <h2 className="text-2xl font-semibold text-brand-navy-900">
          {dict.home.howItWorksHeading}
        </h2>
        <ol className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dict.home.howItWorksSteps.map((step, index) => (
            <li
              key={step}
              className="flex flex-col gap-1 rounded-lg border border-brand-neutral-200 bg-white p-4"
            >
              <span className="text-xs font-semibold text-brand-teal-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-brand-neutral-950">{step}</span>
            </li>
          ))}
        </ol>
        <p className="max-w-xl text-center text-sm text-brand-neutral-600">
          {dict.home.howItWorksNote}
        </p>
      </section>

      {/* 6. Free versus Premium */}
      <section className="flex flex-col items-center gap-6 border-t border-brand-neutral-200 bg-white px-6 py-16 sm:px-10">
        <h2 className="text-2xl font-semibold text-brand-navy-900">
          {dict.home.freeVsPaidHeading}
        </h2>
        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-brand-neutral-200 p-5">
            <h3 className="mb-3 font-semibold text-brand-navy-900">{dict.home.freeLabel}</h3>
            <ul className="flex flex-col gap-2 text-sm text-brand-neutral-600">
              {dict.home.freeFeatures.map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border-2 border-brand-teal-600 p-5">
            <h3 className="mb-3 font-semibold text-brand-navy-900">{dict.home.paidLabel}</h3>
            <ul className="flex flex-col gap-2 text-sm text-brand-neutral-600">
              {dict.home.paidFeatures.map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-sm text-brand-neutral-600">{dict.home.priceNote}</p>
      </section>

      {/* 7. Source/method transparency */}
      <section className="flex flex-col items-center gap-4 border-t border-brand-neutral-200 px-6 py-16 text-center sm:px-10">
        <h2 className="text-2xl font-semibold text-brand-navy-900">
          {dict.home.sourceTransparencyHeading}
        </h2>
        <p className="max-w-xl text-brand-neutral-600">{dict.home.sourceTransparencyBody}</p>
        <Link href="/sources" className="font-medium text-brand-teal-700 hover:underline">
          {dict.home.sourceTransparencyCta} →
        </Link>
      </section>

      {/* 8. Trust / privacy / beta */}
      <section className="flex flex-col items-center gap-6 border-t border-brand-neutral-200 bg-white px-6 py-16 text-center sm:px-10">
        <h2 className="text-2xl font-semibold text-brand-navy-900">{dict.home.trustHeading}</h2>
        <p className="max-w-xl text-brand-neutral-600">{dict.home.trustBody}</p>
        <ul className="flex flex-wrap justify-center gap-3 text-sm text-brand-neutral-600">
          {dict.home.trustPoints.map((point) => (
            <li
              key={point}
              className="rounded-full border border-brand-neutral-200 px-3 py-1"
            >
              {point}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

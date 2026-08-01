import Link from "next/link";
import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { topics, topicCopy } from "@/content/topics";
import { TopicCard } from "@/components/topic-card";
import { OwnQuestionForm } from "@/components/own-question-form";
import { LiveDemoPreview } from "@/components/live-demo-preview";
import { buildExampleReportPreviewSearchResult } from "@/content/example-report-preview";
import { assessEligibility } from "@/lib/eligibility/eligibility";
import { buildTeaserData } from "@/lib/eligibility/teaser";
import { ProcessTimeline } from "@/components/process-timeline";
import { PROCESS_STEP_ICONS } from "@/components/icons/process-step-icons";
import { HeroIllustration } from "@/components/hero-illustration";
import { StudyLookupForm } from "@/components/study-lookup-form";
import { RecentSearchesPanel } from "@/components/recent-searches-panel";

const TEASER_COUNT = 6;

export default async function Home() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const teaserTopics = topics.slice(0, TEASER_COUNT);

  const demoSearchResult = buildExampleReportPreviewSearchResult(dict.home.liveDemoQuestion);
  const demoTeaser = buildTeaserData(demoSearchResult, assessEligibility(demoSearchResult));

  return (
    <main className="flex flex-1 flex-col">
      {/* 1. Brand and promise */}
      <section className="flex flex-col items-center gap-6 px-6 py-10 text-center sm:px-10 sm:py-16">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-teal-700">
          {dict.brand.claim}
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-brand-navy-900 sm:text-4xl">
          {dict.home.description}
        </h1>
        <HeroIllustration className="h-24 w-auto sm:h-28" />
        <LiveDemoPreview dict={dict} teaser={demoTeaser} />
        <Link
          href="#eigene-frage"
          className="rounded-full bg-brand-navy-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
        >
          {dict.home.heroCta}
        </Link>
      </section>

      {/* 2. Own-question input, plus the alternative "compare a study you already have" entry —
          moved directly after the hero (was section 3) so the actual question input is reachable
          without scrolling past the topic grid first (2026-07-31, live-review feedback). */}
      <section
        id="eigene-frage"
        className="flex flex-col items-center gap-6 border-t border-brand-neutral-200 px-6 py-10 sm:px-10 sm:py-16"
      >
        <div className="flex w-full max-w-4xl flex-col items-stretch gap-6 lg:flex-row lg:items-stretch lg:justify-center">
          <Suspense>
            <OwnQuestionForm dict={dict} locale={locale} />
          </Suspense>
          <StudyLookupForm dict={dict} />
        </div>
        <RecentSearchesPanel dict={dict} />
      </section>

      {/* 3. Topic-category inspiration grid */}
      <section className="flex flex-col items-center gap-6 border-t border-brand-neutral-200 bg-white px-6 py-10 sm:px-10 sm:py-16">
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

      {/* 4. Curated example-report preview */}
      <section className="flex flex-col items-center gap-4 border-t border-brand-neutral-200 bg-white px-6 py-10 text-center sm:px-10 sm:py-16">
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
      <section className="flex flex-col items-center gap-6 border-t border-brand-neutral-200 px-6 py-10 sm:px-10 sm:py-16">
        <h2 className="text-2xl font-semibold text-brand-navy-900">
          {dict.home.howItWorksHeading}
        </h2>
        {/* Compressed to 4 grouped steps (was 7) — 2026-08-01, live-review
            feedback. The full 7-stage breakdown stays on /methodology for
            anyone who wants it; icon indices below map to the matching
            stage in PROCESS_STEP_ICONS (question, search, teaser, report). */}
        <ProcessTimeline
          steps={dict.home.howItWorksSteps.map((step, index) => ({
            title: step,
            icon: PROCESS_STEP_ICONS[[0, 2, 4, 6][index]],
          }))}
        />
        <p className="max-w-xl text-center text-sm text-brand-neutral-600">
          {dict.home.howItWorksNote}
        </p>
      </section>

      {/* 6. Free versus Premium */}
      <section className="flex flex-col items-center gap-6 border-t border-brand-neutral-200 bg-white px-6 py-10 sm:px-10 sm:py-16">
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
        <p className="max-w-xl text-center text-sm font-medium text-brand-navy-900">
          {dict.home.priceAnchor}
        </p>
        <p className="max-w-xl text-center text-xs text-brand-neutral-600">
          {dict.home.refundNote}
        </p>
      </section>

      {/* 6b. Differentiation: why not a general-purpose AI chatbot */}
      <section className="flex flex-col items-center gap-6 border-t border-brand-neutral-200 px-6 py-10 sm:px-10 sm:py-16">
        <h2 className="text-2xl font-semibold text-brand-navy-900">
          {dict.home.whyNotChatGptHeading}
        </h2>
        <p className="max-w-xl text-center text-brand-neutral-600">
          {dict.home.whyNotChatGptIntro}
        </p>
        <p className="text-xs text-brand-neutral-600 sm:hidden">
          {dict.home.whyNotChatGptSwipeHint}
        </p>
        <div className="w-full max-w-4xl overflow-x-auto rounded-lg border border-brand-neutral-200 bg-white">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-brand-neutral-200">
                <th scope="col" className="p-4 font-semibold text-brand-navy-900">
                  {dict.home.whyNotChatGptTableCriterionHeader}
                </th>
                <th scope="col" className="p-4 font-semibold text-brand-teal-700">
                  {dict.home.whyNotChatGptTableTekmesisHeader}
                </th>
                <th scope="col" className="p-4 font-semibold text-brand-neutral-600">
                  {dict.home.whyNotChatGptTableChatbotHeader}
                </th>
              </tr>
            </thead>
            <tbody>
              {dict.home.whyNotChatGptRows.map((row, index) => (
                <tr
                  key={row.criterion}
                  className={index % 2 === 1 ? "bg-brand-neutral-50" : undefined}
                >
                  <th scope="row" className="p-4 font-medium text-brand-navy-900">
                    {row.criterion}
                  </th>
                  <td className="p-4 text-brand-neutral-950">{row.tekmesis}</td>
                  <td className="p-4 text-brand-neutral-600">{row.chatbot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/methodology" className="font-medium text-brand-teal-700 hover:underline">
          {dict.home.whyNotChatGptCta} →
        </Link>
      </section>

      {/* 7. Source/method transparency */}
      <section className="flex flex-col items-center gap-4 border-t border-brand-neutral-200 px-6 py-10 text-center sm:px-10 sm:py-16">
        <h2 className="text-2xl font-semibold text-brand-navy-900">
          {dict.home.sourceTransparencyHeading}
        </h2>
        <p className="max-w-xl text-brand-neutral-600">{dict.home.sourceTransparencyBody}</p>
        <Link href="/sources" className="font-medium text-brand-teal-700 hover:underline">
          {dict.home.sourceTransparencyCta} →
        </Link>
      </section>

      {/* 8. Trust / privacy / beta */}
      <section className="flex flex-col items-center gap-6 border-t border-brand-neutral-200 bg-white px-6 py-10 text-center sm:px-10 sm:py-16">
        <h2 className="text-2xl font-semibold text-brand-navy-900">{dict.home.trustHeading}</h2>
        <p className="max-w-xl text-brand-neutral-600">{dict.home.trustBody}</p>
        <p className="max-w-xl font-medium text-brand-teal-700">{dict.home.betaPositioning}</p>
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

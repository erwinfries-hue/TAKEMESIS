import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { topics, topicCopy, getTopic } from "@/content/topics";
import { detectHighRisk } from "@/lib/classification/high-risk";
import { topDomainCandidates } from "@/lib/classification/domain";
import { HighRiskNotice } from "@/components/high-risk-notice";
import { QuestionClarification, type CandidateOption } from "@/components/question-clarification";
import { runSearch } from "@/lib/search/run-search";
import { assessEligibility } from "@/lib/eligibility/eligibility";
import { buildTeaserData } from "@/lib/eligibility/teaser";
import { getPriceConfig, formatPrice } from "@/lib/pricing/price-config";
import { FreeTeaser } from "@/components/free-teaser";
import { PaywallPanel } from "@/components/paywall-panel";
import { NotEligibleNotice } from "@/components/not-eligible-notice";
import { SearchFailedNotice } from "@/components/search-failed-notice";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.searchPage.heading} — ${dict.brand.name}` };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; domain?: string }>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { q, domain } = await searchParams;
  const question = q?.trim() ?? "";

  if (!question) {
    return (
      <main className="flex flex-1 flex-col items-center gap-4 px-6 py-16 text-center sm:px-10">
        <h1 className="text-2xl font-semibold text-brand-navy-900">
          {dict.searchPage.noQuestionHeading}
        </h1>
        <p className="text-brand-neutral-600">{dict.searchPage.noQuestionBody}</p>
        <Link href="/topics" className="font-medium text-brand-teal-700 hover:underline">
          {dict.searchPage.noQuestionCta} →
        </Link>
      </main>
    );
  }

  const highRiskMatches = detectHighRisk(question, locale);
  if (highRiskMatches.length > 0) {
    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <HighRiskNotice dict={dict} />
      </main>
    );
  }

  const confirmedTopic = domain ? getTopic(domain) : undefined;

  if (!confirmedTopic) {
    const candidateScores = topDomainCandidates(question, locale);
    const candidates: CandidateOption[] = candidateScores.map((score) => {
      const topic = topics.find((t) => t.slug === score.slug)!;
      return {
        slug: topic.slug,
        name: topicCopy(topic, locale).name,
        riskProfile: topic.riskProfile,
      };
    });
    const fallbackTopics: CandidateOption[] = topics.map((topic) => ({
      slug: topic.slug,
      name: topicCopy(topic, locale).name,
      riskProfile: topic.riskProfile,
    }));

    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <div className="flex max-w-xl flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-neutral-600">
            {dict.searchPage.heading}
          </p>
          <p className="text-xl font-semibold text-brand-navy-900">{question}</p>
        </div>
        <QuestionClarification
          dict={dict}
          question={question}
          candidates={candidates}
          fallbackTopics={fallbackTopics}
        />
      </main>
    );
  }

  // Domain confirmed: run the real Phase 4/5 search pipeline.
  const searchResult = await runSearch(question, confirmedTopic.slug);
  const allSourcesFailed =
    searchResult.perSource.length > 0 && searchResult.perSource.every((status) => !status.ok);

  if (allSourcesFailed) {
    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <SearchFailedNotice
          dict={dict}
          retryHref={`/search?q=${encodeURIComponent(question)}&domain=${confirmedTopic.slug}`}
        />
      </main>
    );
  }

  const eligibility = assessEligibility(searchResult);

  if (eligibility.status === "not_eligible") {
    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <NotEligibleNotice dict={dict} />
      </main>
    );
  }

  const teaser = buildTeaserData(searchResult, eligibility);
  const priceConfig = getPriceConfig();
  const topicName = topicCopy(confirmedTopic, locale).name;

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-16 sm:px-10">
      {confirmedTopic.riskProfile === "elevated" && (
        <p className="w-full max-w-3xl rounded-lg bg-brand-warning-100 p-3 text-sm text-brand-warning-600">
          {dict.ownQuestionForm.warningHealth}
        </p>
      )}
      <FreeTeaser
        dict={dict}
        locale={locale}
        topicName={topicName}
        teaser={teaser}
        eligibilityStatus={eligibility.status}
      />
      <PaywallPanel
        dict={dict}
        priceDisplay={formatPrice(priceConfig, locale)}
        priceVersion={priceConfig.version}
      />
    </main>
  );
}

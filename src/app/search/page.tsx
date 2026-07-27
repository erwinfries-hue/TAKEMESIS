import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { topics, topicCopy, getTopic } from "@/content/topics";
import { detectHighRisk } from "@/lib/classification/high-risk";
import { topDomainCandidates } from "@/lib/classification/domain";
import { HighRiskNotice } from "@/components/high-risk-notice";
import { QuestionClarification, type CandidateOption } from "@/components/question-clarification";
import { runSearch } from "@/lib/search/run-search";
import { parseFiltersFromParams } from "@/lib/search/filters";
import { parseDoiInput } from "@/lib/search/study-lookup";
import { lookupByDoi } from "@/lib/source-adapters/crossref";
import { assessEligibility } from "@/lib/eligibility/eligibility";
import { buildTeaserData } from "@/lib/eligibility/teaser";
import { getPriceConfig, formatPrice } from "@/lib/pricing/price-config";
import { FreeTeaser } from "@/components/free-teaser";
import { PaywallPanel } from "@/components/paywall-panel";
import { NotEligibleNotice } from "@/components/not-eligible-notice";
import { SearchFailedNotice } from "@/components/search-failed-notice";
import { SearchLimitNotice } from "@/components/search-limit-notice";
import { StudyLookupNotice } from "@/components/study-lookup-notice";
import { SeedStudyPanel } from "@/components/seed-study-panel";
import type { NormalizedRecord } from "@/lib/source-adapters/types";
import { MAX_QUESTION_LENGTH } from "@/lib/security/limits";
import { checkFreeSearchLimit } from "@/lib/security/check-free-search-limit";
import { track } from "@/lib/analytics/track";
import { RecordSearchHistory } from "@/components/record-search-history";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.searchPage.heading} — ${dict.brand.name}` };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    domain?: string;
    maxAgeYears?: string;
    studyTypeGroup?: string | string[];
    doi?: string;
  }>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { q, domain, maxAgeYears, studyTypeGroup, doi: rawDoi } = await searchParams;
  let question = q?.trim() ?? "";
  const filters = parseFiltersFromParams({ maxAgeYears, studyTypeGroup });

  // "Compare a study you already have" mode: doi is present on every
  // request through this flow (clarification step and the final search
  // both need the resolved study, to exclude it from its own comparison
  // list and to render it as "your study"), so it's looked up again on
  // each request rather than cached — no persisted state anywhere else in
  // this flow either.
  let seedStudy: NormalizedRecord | null = null;
  let seedDoi: string | null = null;
  if (rawDoi) {
    const parsedDoi = parseDoiInput(rawDoi);
    if (!parsedDoi) {
      return (
        <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
          <StudyLookupNotice
            dict={dict}
            heading={dict.studyLookupForm.invalidDoiHeading}
            body={dict.studyLookupForm.invalidDoi}
          />
        </main>
      );
    }
    seedDoi = parsedDoi;
    try {
      seedStudy = await lookupByDoi(parsedDoi);
    } catch {
      return (
        <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
          <StudyLookupNotice
            dict={dict}
            heading={dict.studyLookupForm.lookupFailedHeading}
            body={dict.studyLookupForm.lookupFailedBody}
          />
        </main>
      );
    }
    if (!seedStudy?.title) {
      return (
        <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
          <StudyLookupNotice
            dict={dict}
            heading={dict.studyLookupForm.notFoundHeading}
            body={dict.studyLookupForm.notFoundBody}
          />
        </main>
      );
    }
    if (!question) {
      question = seedStudy.title;
    }
  }

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

  if (question.length > MAX_QUESTION_LENGTH) {
    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <SearchLimitNotice
          heading={dict.searchPage.questionTooLongHeading}
          body={dict.searchPage.questionTooLongBody}
        />
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
          doi={seedDoi ?? undefined}
        />
      </main>
    );
  }

  // Domain confirmed — record this regardless of the rate-limit outcome
  // below, since it reflects genuine visitor interest in the domain, not
  // just successful searches; feeds the /topics "N questions already
  // asked" social-proof line once a domain crosses SOCIAL_PROOF_MIN_COUNT.
  // Awaited (not fire-and-forget): on a serverless platform, an un-awaited
  // promise can be cut off once the response is sent. track() never throws
  // even if Supabase is unreachable (see analytics/track.ts), so this never
  // breaks the page — it only ever adds a small, bounded delay.
  await track({ eventName: "domain_classified", metadata: { domainSlug: confirmedTopic.slug } });

  // Domain confirmed: check the free-search limit (decision #7) right before
  // the costly step — the classification/clarification above is free/local.
  const headerStore = await headers();
  const clientIdentifier =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";
  const { allowed } = await checkFreeSearchLimit(clientIdentifier);
  if (!allowed) {
    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <SearchLimitNotice
          heading={dict.searchPage.rateLimitedHeading}
          body={dict.searchPage.rateLimitedBody}
        />
      </main>
    );
  }

  const searchResult = await runSearch(
    question,
    confirmedTopic.slug,
    locale,
    filters,
    seedDoi ?? undefined,
  );
  const allSourcesFailed =
    searchResult.perSource.length > 0 && searchResult.perSource.every((status) => !status.ok);

  if (allSourcesFailed) {
    const retryParams = new URLSearchParams({ q: question, domain: confirmedTopic.slug });
    if (maxAgeYears) retryParams.set("maxAgeYears", maxAgeYears);
    if (rawDoi) retryParams.set("doi", rawDoi);
    for (const group of Array.isArray(studyTypeGroup) ? studyTypeGroup : studyTypeGroup ? [studyTypeGroup] : []) {
      retryParams.append("studyTypeGroup", group);
    }
    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <SearchFailedNotice dict={dict} retryHref={`/search?${retryParams.toString()}`} />
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
  const historyHref = `/search?${new URLSearchParams({ q: question, domain: confirmedTopic.slug }).toString()}`;

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-16 sm:px-10">
      <RecordSearchHistory question={question} href={historyHref} />
      {confirmedTopic.riskProfile === "elevated" && (
        <p className="w-full max-w-3xl rounded-lg bg-brand-warning-100 p-3 text-sm text-brand-warning-600">
          {dict.ownQuestionForm.warningHealth}
        </p>
      )}
      {seedStudy && (
        <>
          <SeedStudyPanel dict={dict} study={seedStudy} />
          <h2 className="w-full max-w-3xl text-left text-sm font-semibold text-brand-neutral-600">
            {dict.studyLookupForm.comparisonHeading}
          </h2>
        </>
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

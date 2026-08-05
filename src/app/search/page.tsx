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
import { runSearchWithAdapters } from "@/lib/search/run-search";
import { adaptersForTopics } from "@/lib/source-adapters/registry";
import { parseFiltersFromParams } from "@/lib/search/filters";
import { parseDoiInput } from "@/lib/search/study-lookup";
import { lookupByDoi } from "@/lib/source-adapters/crossref";
import { assessEligibility } from "@/lib/eligibility/eligibility";
import { buildTeaserData } from "@/lib/eligibility/teaser";
import { getPriceConfig, formatPrice } from "@/lib/pricing/price-config";
import { generateReportToken } from "@/lib/reports/token";
import { SupabaseReportRepository } from "@/lib/reports/supabase-report-repository";
import { transitionReportStatus } from "@/lib/reports/report-service";
import { buildSearchStatsSummary } from "@/lib/reports/search-stats";
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
  return {
    title: `${dict.searchPage.heading} — ${dict.brand.name}`,
    // Every URL here reflects one visitor's typed question (query string) —
    // dynamic, potentially containing sensitive personal wording, never a
    // page worth indexing on its own.
    robots: { index: false, follow: false },
  };
}

/** A question can span at most this many domains at once — more would dilute focus and unnecessarily broaden the source query. */
const MAX_SELECTED_DOMAINS = 2;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    domain?: string | string[];
    maxAgeYears?: string;
    studyTypeGroup?: string | string[];
    studyRegion?: string | string[];
    doi?: string;
  }>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { q, domain, maxAgeYears, studyTypeGroup, studyRegion, doi: rawDoi } = await searchParams;
  let question = q?.trim() ?? "";
  const filters = parseFiltersFromParams({ maxAgeYears, studyTypeGroup, studyRegion });

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

  // Deduplicated, capped at MAX_SELECTED_DOMAINS, invalid slugs dropped —
  // a user who (or a form that) checks more than the cap just has the
  // extras silently ignored rather than erroring; this is a search-quality
  // knob, not a hard validation boundary.
  const requestedDomains = Array.isArray(domain) ? domain : domain ? [domain] : [];
  const confirmedTopics = Array.from(new Set(requestedDomains))
    .map((slug) => getTopic(slug))
    .filter((topic): topic is NonNullable<typeof topic> => topic !== undefined)
    .slice(0, MAX_SELECTED_DOMAINS);

  if (confirmedTopics.length === 0) {
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

  // Domain(s) confirmed — record one event per selected domain, regardless
  // of the rate-limit outcome below, since it reflects genuine visitor
  // interest, not just successful searches; feeds the /topics "N questions
  // already asked" social-proof line and "trending topics" once a domain
  // crosses SOCIAL_PROOF_MIN_COUNT. Awaited (not fire-and-forget): on a
  // serverless platform, an un-awaited promise can be cut off once the
  // response is sent. track() never throws even if Supabase is unreachable
  // (see analytics/track.ts), so this never breaks the page — it only ever
  // adds a small, bounded delay.
  await Promise.all(
    confirmedTopics.map((topic) =>
      track({ eventName: "domain_classified", metadata: { domainSlug: topic.slug } }),
    ),
  );

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

  // `topicSlug` on the result is bookkeeping only (cache tagging, admin
  // display) — not consumed for eligibility/ranking — so the first
  // confirmed domain stands in as "primary" while the adapter list already
  // covers every selected domain's sources.
  const searchResult = await runSearchWithAdapters(
    question,
    confirmedTopics[0].slug,
    adaptersForTopics(confirmedTopics.map((topic) => topic.slug)),
    locale,
    filters,
    seedDoi ?? undefined,
  );
  const allSourcesFailed =
    searchResult.perSource.length > 0 && searchResult.perSource.every((status) => !status.ok);

  const domainParams = (base: URLSearchParams) => {
    for (const topic of confirmedTopics) {
      base.append("domain", topic.slug);
    }
    return base;
  };

  if (allSourcesFailed) {
    const retryParams = domainParams(new URLSearchParams({ q: question }));
    if (maxAgeYears) retryParams.set("maxAgeYears", maxAgeYears);
    if (rawDoi) retryParams.set("doi", rawDoi);
    for (const group of Array.isArray(studyTypeGroup) ? studyTypeGroup : studyTypeGroup ? [studyTypeGroup] : []) {
      retryParams.append("studyTypeGroup", group);
    }
    for (const region of Array.isArray(studyRegion) ? studyRegion : studyRegion ? [studyRegion] : []) {
      retryParams.append("studyRegion", region);
    }
    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <SearchFailedNotice dict={dict} retryHref={`/search?${retryParams.toString()}`} />
      </main>
    );
  }

  const eligibility = assessEligibility(searchResult);

  if (eligibility.status === "not_eligible") {
    const primaryTopic = confirmedTopics[0];
    const exampleTopic = primaryTopic
      ? {
          name: topicCopy(primaryTopic, locale).name,
          // Excludes the user's own (just-failed) question on the off chance it happens to match a curated example verbatim.
          examples: topicCopy(primaryTopic, locale).examples.filter(
            (example) => example.trim().toLowerCase() !== question.trim().toLowerCase(),
          ),
        }
      : null;
    return (
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 sm:px-10">
        <NotEligibleNotice dict={dict} exampleTopic={exampleTopic} />
      </main>
    );
  }

  const teaser = buildTeaserData(searchResult, eligibility);
  const priceConfig = getPriceConfig();
  const topicName = confirmedTopics.map((topic) => topicCopy(topic, locale).name).join(" / ");
  const historyHref = `/search?${domainParams(new URLSearchParams({ q: question })).toString()}`;

  // Creates the report row the "buy" button will check out (OPEN_RISKS.md
  // #14: "create a report record when a teaser renders"). Fails soft: if
  // Supabase is unreachable, the teaser still renders — PaywallPanel just
  // shows a degraded "checkout unavailable" state instead of a broken page.
  let reportId: string | null = null;
  let reportToken: string | null = null;
  try {
    const { token, tokenHash } = generateReportToken();
    const reportRepository = new SupabaseReportRepository();
    const created = await reportRepository.create({
      tokenHash,
      originalQuestion: question,
      locale,
      domainSlug: confirmedTopics[0].slug,
      sourceRoute: confirmedTopics[0].sourceRoute,
      eligibility: eligibility.status,
      priceVersion: priceConfig.version,
      searchStats: buildSearchStatsSummary(searchResult),
      previewPayload: teaser,
    });
    await transitionReportStatus(reportRepository, created.id, "preview_ready");
    reportId = created.id;
    reportToken = token;
  } catch (error) {
    console.error("Failed to create the report row for this teaser", error);
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-16 sm:px-10">
      <RecordSearchHistory question={question} href={historyHref} />
      {confirmedTopics.some((topic) => topic.riskProfile === "elevated") && (
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
        reportId={reportId}
        reportToken={reportToken}
      />
    </main>
  );
}

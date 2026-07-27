import "server-only";
import type { PremiumReportData } from "@/lib/reports/premium-report";
import type { NormalizedRecord } from "@/lib/source-adapters/types";
import { serverEnv } from "@/lib/env/server";
import type { StudyCacheRepository } from "@/lib/studies/study-cache-repository";
import { SupabaseStudyCacheRepository } from "@/lib/studies/supabase-study-cache-repository";
import { studyKeyFor } from "@/lib/studies/types";
import { extractStudyFields as defaultExtractStudyFields, type ExtractedStudyFields } from "./study-extraction";
import { synthesizeReport as defaultSynthesizeReport } from "./report-synthesis";

export interface EnrichPremiumReportParams {
  report: PremiumReportData;
  /** Same order as report.profiles/report.comparison — searchResult.detailed's underlying records. */
  detailedRecords: NormalizedRecord[];
  /** Recorded on cache hits/writes only (docs/CONCEPT_STUDY_KNOWLEDGE_BASE.md) — never gates or changes the report itself. */
  topicSlug?: string | null;
}

export interface EnrichPremiumReportDeps {
  extractStudyFields?: typeof defaultExtractStudyFields;
  synthesizeReport?: typeof defaultSynthesizeReport;
  /** Read-through cache for AI-extracted study fields, keyed by DOI/source-ID. Defaults to Supabase; pass an in-memory fake in tests. */
  studyCache?: StudyCacheRepository;
}

/**
 * Read-through cache wrapper around extractStudyFields: a cache hit skips
 * the AI call entirely (docs/CONCEPT_STUDY_KNOWLEDGE_BASE.md — cost,
 * latency, and run-to-run consistency for studies seen before); a miss
 * extracts live and writes through. Cache I/O failures are swallowed and
 * logged rather than propagated — this is purely an internal optimization
 * layer and must never turn a cache outage into a degraded report.
 */
async function extractWithCache(
  record: NormalizedRecord,
  extractStudyFields: typeof defaultExtractStudyFields,
  studyCache: StudyCacheRepository,
  topicSlug: string | null,
): Promise<ExtractedStudyFields | null> {
  try {
    const cached = await studyCache.findByKey(studyKeyFor(record));
    if (cached?.aiFields) {
      return cached.aiFields;
    }
  } catch (error) {
    console.error("Study cache lookup failed — extracting live instead:", error);
  }

  const fields = await extractStudyFields(record);

  if (fields) {
    // Best effort: a failed write never invalidates the extraction that
    // will still be used for this report.
    void studyCache.upsert({ record, aiFields: fields, topicSlug }).catch((error: unknown) => {
      console.error("Study cache write failed — continuing without caching:", error);
    });
  }

  return fields;
}

/**
 * Calls real AI extraction/synthesis when ANTHROPIC_API_KEY and
 * AI_EXTRACTION_ENABLED are both set; otherwise returns the report
 * unchanged — the same honest null/false state buildPremiumReportData
 * already produces. Fails safe: any AI error or malformed response leaves
 * the report as-is rather than crashing the page or fabricating content
 * (evidence integrity rule: unknown stays null, never guessed).
 */
export async function enrichPremiumReportWithAi(
  { report, detailedRecords, topicSlug = null }: EnrichPremiumReportParams,
  deps: EnrichPremiumReportDeps = {},
): Promise<PremiumReportData> {
  if (!serverEnv.AI_EXTRACTION_ENABLED || !serverEnv.ANTHROPIC_API_KEY) {
    return report;
  }

  const extractStudyFields = deps.extractStudyFields ?? defaultExtractStudyFields;
  const synthesizeReport = deps.synthesizeReport ?? defaultSynthesizeReport;
  const studyCache = deps.studyCache ?? new SupabaseStudyCacheRepository();

  try {
    const extractedPerStudy = await Promise.all(
      detailedRecords.map((record) => extractWithCache(record, extractStudyFields, studyCache, topicSlug)),
    );

    const profiles = report.profiles.map((profile, index) => {
      const fields = extractedPerStudy[index];
      return fields ? { ...profile, ...fields } : profile;
    });

    const comparison = report.comparison.map((row, index) => {
      const fields = extractedPerStudy[index];
      if (!fields) return row;
      return {
        ...row,
        outcome: fields.outcome,
        keyFinding: fields.result,
        limitations: fields.limitations,
      };
    });

    const synthesis = await synthesizeReport({
      question: report.originalQuestion,
      confidenceLabel: report.confidenceLabel,
      studies: report.profiles.map((profile, index) => ({
        citation: profile.citation,
        design: profile.design,
        fields: extractedPerStudy[index],
      })),
    });

    return {
      ...report,
      profiles,
      comparison,
      keyFindings: synthesis?.keyFindings ?? report.keyFindings,
      synthesisAvailable: synthesis !== null,
      synthesisText: synthesis?.synthesis ?? null,
      practicalInterpretationAvailable: synthesis !== null,
      practicalInterpretationText: synthesis?.practicalInterpretation ?? null,
    };
  } catch (error) {
    console.error("AI enrichment failed — falling back to the structural-only report:", error);
    return report;
  }
}

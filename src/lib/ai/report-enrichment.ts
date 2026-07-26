import "server-only";
import type { PremiumReportData } from "@/lib/reports/premium-report";
import type { NormalizedRecord } from "@/lib/source-adapters/types";
import { serverEnv } from "@/lib/env/server";
import { extractStudyFields as defaultExtractStudyFields } from "./study-extraction";
import { synthesizeReport as defaultSynthesizeReport } from "./report-synthesis";

export interface EnrichPremiumReportParams {
  report: PremiumReportData;
  /** Same order as report.profiles/report.comparison — searchResult.detailed's underlying records. */
  detailedRecords: NormalizedRecord[];
}

export interface EnrichPremiumReportDeps {
  extractStudyFields?: typeof defaultExtractStudyFields;
  synthesizeReport?: typeof defaultSynthesizeReport;
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
  { report, detailedRecords }: EnrichPremiumReportParams,
  deps: EnrichPremiumReportDeps = {},
): Promise<PremiumReportData> {
  if (!serverEnv.AI_EXTRACTION_ENABLED || !serverEnv.ANTHROPIC_API_KEY) {
    return report;
  }

  const extractStudyFields = deps.extractStudyFields ?? defaultExtractStudyFields;
  const synthesizeReport = deps.synthesizeReport ?? defaultSynthesizeReport;

  try {
    const extractedPerStudy = await Promise.all(
      detailedRecords.map((record) => extractStudyFields(record)),
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

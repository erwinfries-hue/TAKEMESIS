/**
 * Normalized record shape and adapter interface — per
 * docs/07_EVIDENCE_SOURCES_RETRIEVAL_AND_ELIGIBILITY.md ("Normalized record",
 * "Adapter interface") and docs/10_TECHNICAL_ARCHITECTURE_AND_DATA_MODEL.md.
 *
 * Every adapter (OpenAlex, Crossref, Europe PMC, NCBI E-utilities, ...)
 * implements SourceAdapter and returns NormalizedRecord[] so downstream
 * ranking/screening/eligibility code never needs to know which upstream API
 * a record came from.
 */

export type SourceId = "openalex" | "crossref" | "europe_pmc" | "ncbi_pubmed";

export type PublicationType =
  | "meta_analysis"
  | "systematic_review"
  | "rct"
  | "quasi_experimental"
  | "cohort"
  | "case_control"
  | "cross_sectional"
  | "case_report"
  | "review"
  | "protocol"
  | "other"
  | "unknown";

/**
 * How much of the record's content is available to work with. Per the
 * evidence-safety rules: "distinguish metadata-only from abstract/full-text-
 * supported analysis" and "stricter eligibility when abstracts/results are
 * unavailable" — this field is what later eligibility logic reads to enforce
 * that.
 */
export type DataCompleteness = "full_text" | "abstract" | "metadata_only";

export type RetractionStatus = "retracted" | "corrected" | "none" | "unknown";

export interface NormalizedRecord {
  source: SourceId;
  sourceId: string;
  doi: string | null;
  title: string | null;
  authors: string[];
  venue: string | null;
  year: number | null;
  publicationType: PublicationType;
  /** Never fabricated: null (→ "Nicht angegeben" / "Not reported") when the source didn't provide one. */
  abstract: string | null;
  isOpenAccess: boolean | null;
  retractionStatus: RetractionStatus;
  subjectConcepts: string[];
  sourceUrl: string | null;
  dataCompleteness: DataCompleteness;
  /** Provenance: when this record was fetched, for search-date disclosure. */
  fetchedAt: string;
}

export interface SourceSearchParams {
  query: string;
  /** Result cap — callers should pass the eligibility-tier study cap (decision #8: 15), not fetch unbounded. */
  limit?: number;
}

export interface SourceAdapterCapabilities {
  id: SourceId;
  name: string;
  domainCoverage: "broad_discovery" | "metadata_verification" | "biomedical";
  requiresApiKey: boolean;
}

export interface SourceStatus {
  source: SourceId;
  ok: boolean;
  checkedAt: string;
  error?: string;
}

export interface SourceAdapter {
  capabilities: SourceAdapterCapabilities;
  search(params: SourceSearchParams): Promise<NormalizedRecord[]>;
  checkStatus(): Promise<SourceStatus>;
}

export class SourceAdapterError extends Error {
  readonly source: SourceId;
  readonly cause?: unknown;

  constructor(message: string, source: SourceId, cause?: unknown) {
    super(message);
    this.name = "SourceAdapterError";
    this.source = source;
    this.cause = cause;
  }
}

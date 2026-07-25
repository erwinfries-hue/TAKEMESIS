import "server-only";
import { fetchJson } from "./http";
import { inferPublicationType } from "./publication-type";
import type {
  NormalizedRecord,
  RetractionStatus,
  SourceAdapter,
  SourceSearchParams,
  SourceStatus,
} from "./types";
import { serverEnv } from "@/lib/env/server";

interface EuropePmcResult {
  id?: string;
  source?: string;
  pmid?: string;
  doi?: string;
  title?: string;
  authorString?: string;
  journalTitle?: string;
  pubYear?: string;
  pubTypeList?: { pubType?: string[] };
  abstractText?: string;
  isOpenAccess?: string;
}

interface EuropePmcResponse {
  resultList?: { result?: EuropePmcResult[] };
}

function extractAuthors(authorString: string | undefined): string[] {
  if (!authorString) {
    return [];
  }
  return authorString
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

function extractRetractionStatus(pubTypes: string[]): RetractionStatus {
  const joined = pubTypes.join(" ").toLowerCase();
  if (joined.includes("retraction")) {
    return "retracted";
  }
  if (joined.includes("corrected") || joined.includes("erratum")) {
    return "corrected";
  }
  return "unknown";
}

function toNormalizedRecord(result: EuropePmcResult, fetchedAt: string): NormalizedRecord {
  const pubTypes = result.pubTypeList?.pubType ?? [];
  const abstract = result.abstractText?.trim() || null;
  const year = result.pubYear ? Number.parseInt(result.pubYear, 10) : null;

  return {
    source: "europe_pmc",
    sourceId: result.id ?? result.pmid ?? "",
    doi: result.doi ?? null,
    title: result.title ?? null,
    authors: extractAuthors(result.authorString),
    venue: result.journalTitle ?? null,
    year: Number.isNaN(year) ? null : year,
    publicationType: inferPublicationType(result.title, ...pubTypes),
    abstract,
    isOpenAccess:
      result.isOpenAccess === "Y" ? true : result.isOpenAccess === "N" ? false : null,
    retractionStatus: extractRetractionStatus(pubTypes),
    subjectConcepts: [],
    sourceUrl:
      result.source && result.id
        ? `https://europepmc.org/article/${result.source}/${result.id}`
        : null,
    dataCompleteness: abstract ? "abstract" : "metadata_only",
    fetchedAt,
  };
}

const BASE_URL = () => serverEnv.EUROPE_PMC_BASE_URL;

function buildSearchUrl(params: SourceSearchParams): string {
  const url = new URL(`${BASE_URL()}/search`);
  url.searchParams.set("query", params.query);
  url.searchParams.set("format", "json");
  url.searchParams.set("pageSize", String(params.limit ?? 15));
  return url.toString();
}

export const europePmcAdapter: SourceAdapter = {
  capabilities: {
    id: "europe_pmc",
    name: "Europe PMC",
    domainCoverage: "biomedical",
    requiresApiKey: false,
  },

  async search(params: SourceSearchParams): Promise<NormalizedRecord[]> {
    const fetchedAt = new Date().toISOString();
    const data = (await fetchJson(buildSearchUrl(params), {
      source: "europe_pmc",
    })) as EuropePmcResponse;
    return (data.resultList?.result ?? []).map((result) => toNormalizedRecord(result, fetchedAt));
  },

  async checkStatus(): Promise<SourceStatus> {
    const checkedAt = new Date().toISOString();
    try {
      await fetchJson(buildSearchUrl({ query: "science", limit: 1 }), {
        source: "europe_pmc",
        maxRetries: 0,
        timeoutMs: 5000,
      });
      return { source: "europe_pmc", ok: true, checkedAt };
    } catch (error) {
      return {
        source: "europe_pmc",
        ok: false,
        checkedAt,
        error: error instanceof Error ? error.message : "unknown error",
      };
    }
  },
};

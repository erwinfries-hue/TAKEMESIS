import "server-only";
import { fetchJson } from "./http";
import { inferPublicationType } from "./publication-type";
import type {
  NormalizedRecord,
  SourceAdapter,
  SourceSearchParams,
  SourceStatus,
} from "./types";
import { serverEnv } from "@/lib/env/server";

interface EsearchResponse {
  esearchresult?: { idlist?: string[] };
}

interface EsummaryDocSummary {
  uid?: string;
  title?: string;
  authors?: Array<{ name?: string }>;
  fulljournalname?: string;
  source?: string;
  pubdate?: string;
  elocationid?: string;
  pubtype?: string[];
  error?: string;
}

interface EsummaryResponse {
  result?: { uids?: string[] } & Record<string, EsummaryDocSummary | string[] | undefined>;
}

function extractYear(pubdate: string | undefined): number | null {
  const match = pubdate?.match(/^(\d{4})/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function extractDoi(elocationid: string | undefined): string | null {
  const match = elocationid?.match(/10\.\d{4,9}\/\S+/);
  return match ? match[0] : null;
}

function toNormalizedRecord(doc: EsummaryDocSummary, fetchedAt: string): NormalizedRecord {
  const pubTypes = doc.pubtype ?? [];
  const uid = doc.uid ?? "";

  return {
    source: "ncbi_pubmed",
    sourceId: uid,
    doi: extractDoi(doc.elocationid),
    title: doc.title ?? null,
    authors: (doc.authors ?? []).map((a) => a.name).filter((name): name is string => Boolean(name)),
    venue: doc.fulljournalname ?? doc.source ?? null,
    year: extractYear(doc.pubdate),
    publicationType: inferPublicationType(doc.title, ...pubTypes),
    // esummary never returns abstract text; efetch would be needed for that
    // (documented P1 follow-up, not silently pretended here).
    abstract: null,
    isOpenAccess: null,
    retractionStatus: pubTypes.some((t) => t.toLowerCase().includes("retraction"))
      ? "retracted"
      : "unknown",
    subjectConcepts: [],
    sourceUrl: uid ? `https://pubmed.ncbi.nlm.nih.gov/${uid}/` : null,
    dataCompleteness: "metadata_only",
    fetchedAt,
  };
}

const BASE_URL = () => serverEnv.NCBI_EUTILS_BASE_URL;

function commonParams(url: URL): void {
  url.searchParams.set("tool", serverEnv.NCBI_TOOL);
  if (serverEnv.NCBI_EMAIL) {
    url.searchParams.set("email", serverEnv.NCBI_EMAIL);
  }
  if (serverEnv.NCBI_API_KEY) {
    url.searchParams.set("api_key", serverEnv.NCBI_API_KEY);
  }
}

function buildEsearchUrl(params: SourceSearchParams): string {
  const url = new URL(`${BASE_URL()}/esearch.fcgi`);
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("term", params.query);
  url.searchParams.set("retmode", "json");
  url.searchParams.set("retmax", String(params.limit ?? 15));
  commonParams(url);
  return url.toString();
}

function buildEsummaryUrl(ids: string[]): string {
  const url = new URL(`${BASE_URL()}/esummary.fcgi`);
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("retmode", "json");
  commonParams(url);
  return url.toString();
}

export const ncbiAdapter: SourceAdapter = {
  capabilities: {
    id: "ncbi_pubmed",
    name: "NCBI PubMed (E-utilities)",
    domainCoverage: "biomedical",
    requiresApiKey: false,
  },

  async search(params: SourceSearchParams): Promise<NormalizedRecord[]> {
    const fetchedAt = new Date().toISOString();

    const esearchData = (await fetchJson(buildEsearchUrl(params), {
      source: "ncbi_pubmed",
    })) as EsearchResponse;
    const ids = esearchData.esearchresult?.idlist ?? [];
    if (ids.length === 0) {
      return [];
    }

    const esummaryData = (await fetchJson(buildEsummaryUrl(ids), {
      source: "ncbi_pubmed",
    })) as EsummaryResponse;

    return ids
      .map((id) => esummaryData.result?.[id])
      .filter((doc): doc is EsummaryDocSummary => Boolean(doc) && !Array.isArray(doc))
      .map((doc) => toNormalizedRecord(doc, fetchedAt));
  },

  async checkStatus(): Promise<SourceStatus> {
    const checkedAt = new Date().toISOString();
    try {
      await fetchJson(buildEsearchUrl({ query: "science", limit: 1 }), {
        source: "ncbi_pubmed",
        maxRetries: 0,
        timeoutMs: 5000,
      });
      return { source: "ncbi_pubmed", ok: true, checkedAt };
    } catch (error) {
      return {
        source: "ncbi_pubmed",
        ok: false,
        checkedAt,
        error: error instanceof Error ? error.message : "unknown error",
      };
    }
  },
};

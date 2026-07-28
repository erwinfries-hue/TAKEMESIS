import "server-only";
import { XMLParser } from "fast-xml-parser";
import { fetchJson, fetchText } from "./http";
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
    // esummary never returns abstract text — filled in below (if available)
    // by a second, separate efetch call over the same id list.
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

/**
 * efetch's `PubmedArticleSet` XML, not esummary's JSON — a second round trip
 * over the same id list. `PMID`/`AbstractText` carry attributes (Version,
 * Label/NlmCategory for structured abstracts) alongside text, so
 * fast-xml-parser gives `{ "#text": ..., "@_...": ... }` for those; a plain
 * unstructured `<AbstractText>` with no attributes parses as a bare string.
 * `isArray` forces both to always-array so single-article/single-paragraph
 * responses don't need separate non-array code paths.
 */
const efetchXmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => ["PubmedArticle", "AbstractText"].includes(tagName),
});

interface PubmedTextNode {
  // fast-xml-parser coerces purely-numeric text (e.g. a PMID) into a JS
  // number by default — normalized back to string in extractPmid, since
  // record.sourceId (from esummary) is always a string and a Map lookup
  // needs matching key types.
  "#text"?: string | number;
  "@_Label"?: string;
}

type PubmedAbstractText = string | PubmedTextNode;

interface PubmedArticle {
  MedlineCitation?: {
    PMID?: string | PubmedTextNode;
    Article?: {
      Abstract?: {
        AbstractText?: PubmedAbstractText[];
      };
    };
  };
}

interface PubmedArticleSetResponse {
  PubmedArticleSet?: {
    PubmedArticle?: PubmedArticle[];
  };
}

function extractPmid(pmid: string | PubmedTextNode | undefined): string | null {
  if (typeof pmid === "string") return pmid;
  const text = pmid?.["#text"];
  return text !== undefined ? String(text) : null;
}

/** Structured abstracts (RCTs, systematic reviews) carry a Label per paragraph — kept as a prefix so the sections stay legible, not discarded. */
function extractAbstractText(parts: PubmedAbstractText[] | undefined): string | null {
  if (!parts || parts.length === 0) {
    return null;
  }
  const texts = parts
    .map((part) => {
      if (typeof part === "string") return part;
      const text = part["#text"];
      if (!text) return null;
      return part["@_Label"] ? `${part["@_Label"]}: ${text}` : String(text);
    })
    .filter((text): text is string => Boolean(text));
  return texts.length > 0 ? texts.join(" ") : null;
}

/**
 * Best-effort enrichment, not a hard requirement (docs/10: "Resilience") —
 * esearch+esummary already produced valid metadata-only records by the time
 * this runs. Any failure here (efetch down, malformed XML) degrades silently
 * to an empty map rather than failing the whole search: callers just keep
 * the metadata_only records they already had instead of losing NCBI
 * entirely over a missing abstract.
 */
async function fetchAbstracts(ids: string[]): Promise<Map<string, string>> {
  const abstracts = new Map<string, string>();
  try {
    const xml = await fetchText(buildEfetchUrl(ids), { source: "ncbi_pubmed" });
    const parsed = efetchXmlParser.parse(xml) as PubmedArticleSetResponse;
    for (const article of parsed.PubmedArticleSet?.PubmedArticle ?? []) {
      const pmid = extractPmid(article.MedlineCitation?.PMID);
      const abstract = extractAbstractText(article.MedlineCitation?.Article?.Abstract?.AbstractText);
      if (pmid && abstract) {
        abstracts.set(pmid, abstract);
      }
    }
  } catch {
    return new Map();
  }
  return abstracts;
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

/**
 * PubMed's Automatic Term Mapping treats a bare space-separated phrase
 * loosely — confirmed live (2026-07-28, OPEN_RISKS.md #2): a query for
 * "creatine muscle growth" returned results about heart failure and
 * unrelated muscle physiology, none mentioning creatine at all. Explicit
 * `AND` between every term forces a strict intersection instead, per
 * NCBI's own documented search syntax (https://www.ncbi.nlm.nih.gov/books/NBK25501/).
 */
function buildPubmedTerm(query: string): string {
  const terms = query.split(/\s+/).filter(Boolean);
  return terms.length > 1 ? terms.join(" AND ") : query;
}

function buildEsearchUrl(params: SourceSearchParams): string {
  const url = new URL(`${BASE_URL()}/esearch.fcgi`);
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("term", buildPubmedTerm(params.query));
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

function buildEfetchUrl(ids: string[]): string {
  const url = new URL(`${BASE_URL()}/efetch.fcgi`);
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("retmode", "xml");
  url.searchParams.set("rettype", "abstract");
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

    const records = ids
      .map((id) => esummaryData.result?.[id])
      .filter((doc): doc is EsummaryDocSummary => Boolean(doc) && !Array.isArray(doc))
      .map((doc) => toNormalizedRecord(doc, fetchedAt));

    const abstracts = await fetchAbstracts(ids);
    return records.map((record) => {
      const abstract = abstracts.get(record.sourceId);
      return abstract ? { ...record, abstract, dataCompleteness: "abstract" as const } : record;
    });
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

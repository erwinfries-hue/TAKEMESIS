import "server-only";
import { XMLParser } from "fast-xml-parser";
import { fetchText } from "./http";
import { inferPublicationType } from "./publication-type";
import type { NormalizedRecord, SourceAdapter, SourceSearchParams, SourceStatus } from "./types";
import { serverEnv } from "@/lib/env/server";

const BASE_URL = () => serverEnv.ARXIV_BASE_URL;

/**
 * arXiv is the one adapter whose API returns Atom XML rather than JSON
 * (docs.arxiv.org/help/api) — hence its own parser instance and `fetchText`
 * instead of the `fetchJson` the other three adapters use. `removeNSPrefix`
 * strips the `arxiv:`/`opensearch:` namespace prefixes (so `arxiv:doi`
 * parses as `doi`); `isArray` forces always-array even for a single
 * entry/author/link/category, since fast-xml-parser otherwise returns a
 * bare object when there's exactly one.
 */
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  isArray: (tagName) => ["entry", "author", "link", "category"].includes(tagName),
});

interface ArxivLink {
  "@_href"?: string;
  "@_rel"?: string;
}

interface ArxivAuthor {
  name?: string;
}

interface ArxivCategory {
  "@_term"?: string;
}

interface ArxivEntry {
  id?: string;
  title?: string;
  summary?: string;
  published?: string;
  author?: ArxivAuthor[];
  link?: ArxivLink[];
  category?: ArxivCategory[];
  doi?: string;
  journal_ref?: string;
}

interface ArxivFeed {
  feed?: {
    entry?: ArxivEntry[];
  };
}

/** arXiv titles/summaries are hard-wrapped with literal newlines in the Atom XML — collapse to plain, trimmed text. */
function cleanText(text: string | undefined): string | null {
  if (!text) {
    return null;
  }
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > 0 ? collapsed : null;
}

function extractArxivId(id: string | undefined): string {
  if (!id) {
    return "";
  }
  const match = id.match(/abs\/(.+)$/);
  return match ? match[1] : id;
}

function extractYear(published: string | undefined): number | null {
  if (!published) {
    return null;
  }
  const year = Number.parseInt(published.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

function extractAuthors(authors: ArxivAuthor[] | undefined): string[] {
  return (authors ?? []).map((a) => a.name).filter((name): name is string => Boolean(name));
}

function extractAbstractPageUrl(entry: ArxivEntry): string | null {
  const alternate = (entry.link ?? []).find((link) => link["@_rel"] === "alternate");
  return alternate?.["@_href"] ?? (entry.id ? entry.id.replace(/^http:/, "https:") : null);
}

/**
 * Per the API docs, errors (e.g. malformed search_query syntax) come back
 * as HTTP 200 with a single Atom entry whose id points at arxiv.org's error
 * namespace — filtered out here rather than mis-parsed as a real record.
 */
function isErrorEntry(entry: ArxivEntry): boolean {
  return typeof entry.id === "string" && entry.id.includes("arxiv.org/api/errors");
}

function toNormalizedRecord(entry: ArxivEntry, fetchedAt: string): NormalizedRecord {
  const title = cleanText(entry.title);
  const abstract = cleanText(entry.summary);

  return {
    source: "arxiv",
    sourceId: extractArxivId(entry.id),
    doi: entry.doi ?? null,
    title,
    authors: extractAuthors(entry.author),
    // arXiv is a preprint repository, not a journal — journal_ref is only
    // present if/once a paper was later published elsewhere.
    venue: entry.journal_ref ?? "arXiv",
    year: extractYear(entry.published),
    publicationType: inferPublicationType(title, abstract),
    abstract,
    // arXiv preprints are freely readable on arxiv.org by design.
    isOpenAccess: true,
    // Withdrawn/superseded status isn't reliably inferable from this feed's fields — never guessed.
    retractionStatus: "unknown",
    subjectConcepts: (entry.category ?? [])
      .map((c) => c["@_term"])
      .filter((term): term is string => Boolean(term)),
    sourceUrl: extractAbstractPageUrl(entry),
    dataCompleteness: abstract ? "abstract" : "metadata_only",
    fetchedAt,
  };
}

function buildSearchUrl(params: SourceSearchParams): string {
  const url = new URL(BASE_URL());
  url.searchParams.set("search_query", `all:${params.query}`);
  url.searchParams.set("start", "0");
  url.searchParams.set("max_results", String(params.limit ?? 15));
  return url.toString();
}

async function searchRaw(params: SourceSearchParams): Promise<ArxivEntry[]> {
  const xml = await fetchText(buildSearchUrl(params), {
    source: "arxiv",
    headers: { "User-Agent": "TEKMESIS/1.0" },
  });
  const parsed = xmlParser.parse(xml) as ArxivFeed;
  return (parsed.feed?.entry ?? []).filter((entry) => !isErrorEntry(entry));
}

export const arxivAdapter: SourceAdapter = {
  capabilities: {
    id: "arxiv",
    name: "arXiv",
    domainCoverage: "technology_research",
    requiresApiKey: false,
  },

  async search(params: SourceSearchParams): Promise<NormalizedRecord[]> {
    const fetchedAt = new Date().toISOString();
    const entries = await searchRaw(params);
    return entries.map((entry) => toNormalizedRecord(entry, fetchedAt));
  },

  async checkStatus(): Promise<SourceStatus> {
    const checkedAt = new Date().toISOString();
    try {
      await fetchText(buildSearchUrl({ query: "science", limit: 1 }), {
        source: "arxiv",
        headers: { "User-Agent": "TEKMESIS/1.0" },
        maxRetries: 0,
        timeoutMs: 5000,
      });
      return { source: "arxiv", ok: true, checkedAt };
    } catch (error) {
      return {
        source: "arxiv",
        ok: false,
        checkedAt,
        error: error instanceof Error ? error.message : "unknown error",
      };
    }
  },
};

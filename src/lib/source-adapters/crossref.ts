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

interface CrossrefDateParts {
  "date-parts"?: number[][];
}

interface CrossrefItem {
  DOI?: string;
  title?: string[];
  author?: Array<{ given?: string; family?: string; name?: string }>;
  "container-title"?: string[];
  published?: CrossrefDateParts;
  "published-print"?: CrossrefDateParts;
  "published-online"?: CrossrefDateParts;
  type?: string;
  abstract?: string;
  subject?: string[];
  URL?: string;
  "update-to"?: Array<{ type?: string }>;
}

interface CrossrefResponse {
  message?: { items?: CrossrefItem[] };
}

/** Crossref abstracts are JATS-tagged (e.g. "<jats:p>...</jats:p>"); strip tags for plain text. */
export function stripJatsTags(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > 0 ? plain : null;
}

function extractYear(item: CrossrefItem): number | null {
  const dateParts =
    item.published?.["date-parts"] ??
    item["published-print"]?.["date-parts"] ??
    item["published-online"]?.["date-parts"];
  const year = dateParts?.[0]?.[0];
  return typeof year === "number" ? year : null;
}

function extractAuthors(item: CrossrefItem): string[] {
  return (item.author ?? [])
    .map((a) => a.name ?? [a.given, a.family].filter(Boolean).join(" ").trim())
    .filter((name) => name.length > 0);
}

function extractRetractionStatus(item: CrossrefItem): RetractionStatus {
  const updates = item["update-to"] ?? [];
  if (updates.some((u) => u.type === "retraction")) {
    return "retracted";
  }
  if (updates.some((u) => u.type === "correction")) {
    return "corrected";
  }
  return "unknown";
}

function toNormalizedRecord(item: CrossrefItem, fetchedAt: string): NormalizedRecord {
  const title = item.title?.[0] ?? null;
  const abstract = stripJatsTags(item.abstract);

  return {
    source: "crossref",
    sourceId: item.DOI ?? "",
    doi: item.DOI ?? null,
    title,
    authors: extractAuthors(item),
    venue: item["container-title"]?.[0] ?? null,
    year: extractYear(item),
    publicationType: inferPublicationType(title, item.type),
    abstract,
    // Crossref's basic /works response doesn't reliably indicate OA status.
    isOpenAccess: null,
    retractionStatus: extractRetractionStatus(item),
    subjectConcepts: item.subject ?? [],
    sourceUrl: item.URL ?? (item.DOI ? `https://doi.org/${item.DOI}` : null),
    dataCompleteness: abstract ? "abstract" : "metadata_only",
    fetchedAt,
  };
}

const BASE_URL = () => serverEnv.CROSSREF_BASE_URL;

function buildSearchUrl(params: SourceSearchParams): string {
  const url = new URL(`${BASE_URL()}/works`);
  url.searchParams.set("query", params.query);
  url.searchParams.set("rows", String(params.limit ?? 15));
  return url.toString();
}

/** Crossref's "polite pool": identify the client with a contact email for better rate limits. */
function politeHeaders(): Record<string, string> {
  const contact = serverEnv.NCBI_EMAIL ? ` (mailto:${serverEnv.NCBI_EMAIL})` : "";
  return { "User-Agent": `TEKMESIS/1.0${contact}` };
}

export const crossrefAdapter: SourceAdapter = {
  capabilities: {
    id: "crossref",
    name: "Crossref",
    domainCoverage: "metadata_verification",
    requiresApiKey: false,
  },

  async search(params: SourceSearchParams): Promise<NormalizedRecord[]> {
    const fetchedAt = new Date().toISOString();
    const data = (await fetchJson(buildSearchUrl(params), {
      source: "crossref",
      headers: politeHeaders(),
    })) as CrossrefResponse;
    return (data.message?.items ?? []).map((item) => toNormalizedRecord(item, fetchedAt));
  },

  async checkStatus(): Promise<SourceStatus> {
    const checkedAt = new Date().toISOString();
    try {
      await fetchJson(buildSearchUrl({ query: "science", limit: 1 }), {
        source: "crossref",
        headers: politeHeaders(),
        maxRetries: 0,
        timeoutMs: 5000,
      });
      return { source: "crossref", ok: true, checkedAt };
    } catch (error) {
      return {
        source: "crossref",
        ok: false,
        checkedAt,
        error: error instanceof Error ? error.message : "unknown error",
      };
    }
  },
};

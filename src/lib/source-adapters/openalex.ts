import "server-only";
import { fetchJson, type FetchJsonOptions } from "./http";
import { inferPublicationType } from "./publication-type";
import type {
  NormalizedRecord,
  SourceAdapter,
  SourceSearchParams,
  SourceStatus,
} from "./types";
import { serverEnv } from "@/lib/env/server";

/** Minimal shape of what we read from the OpenAlex /works response. Fields
 * not read here are intentionally omitted rather than typed speculatively. */
interface OpenAlexWork {
  id?: string;
  doi?: string | null;
  title?: string | null;
  publication_year?: number | null;
  type?: string | null;
  authorships?: Array<{ author?: { display_name?: string | null } | null }>;
  primary_location?: {
    source?: { display_name?: string | null } | null;
    landing_page_url?: string | null;
  } | null;
  open_access?: { is_oa?: boolean | null } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  concepts?: Array<{ display_name?: string | null }>;
  is_retracted?: boolean | null;
}

interface OpenAlexResponse {
  results?: OpenAlexWork[];
}

export function reconstructAbstract(
  invertedIndex: Record<string, number[]> | null | undefined,
): string | null {
  if (!invertedIndex) {
    return null;
  }
  const positioned: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) {
      positioned.push([position, word]);
    }
  }
  if (positioned.length === 0) {
    return null;
  }
  positioned.sort((a, b) => a[0] - b[0]);
  return positioned.map(([, word]) => word).join(" ");
}

function toNormalizedRecord(work: OpenAlexWork, fetchedAt: string): NormalizedRecord {
  const abstract = reconstructAbstract(work.abstract_inverted_index);
  const authors = (work.authorships ?? [])
    .map((a) => a.author?.display_name)
    .filter((name): name is string => Boolean(name));
  const concepts = (work.concepts ?? [])
    .map((c) => c.display_name)
    .filter((name): name is string => Boolean(name));

  return {
    source: "openalex",
    sourceId: work.id ?? "",
    doi: work.doi ?? null,
    title: work.title ?? null,
    authors,
    venue: work.primary_location?.source?.display_name ?? null,
    year: work.publication_year ?? null,
    publicationType: inferPublicationType(work.title, work.type),
    abstract,
    isOpenAccess: work.open_access?.is_oa ?? null,
    retractionStatus: work.is_retracted ? "retracted" : "none",
    subjectConcepts: concepts,
    sourceUrl: work.id ?? work.primary_location?.landing_page_url ?? null,
    dataCompleteness: abstract ? "abstract" : "metadata_only",
    fetchedAt,
  };
}

const BASE_URL = () => serverEnv.OPENALEX_BASE_URL;

function buildSearchUrl(params: SourceSearchParams): string {
  const url = new URL(`${BASE_URL()}/works`);
  url.searchParams.set("search", params.query);
  url.searchParams.set("per-page", String(params.limit ?? 15));
  if (serverEnv.NCBI_EMAIL) {
    // OpenAlex's "polite pool" convention: any contact email improves rate limits.
    url.searchParams.set("mailto", serverEnv.NCBI_EMAIL);
  }
  return url.toString();
}

const fetchOptions: Partial<FetchJsonOptions> = { source: "openalex" };

export const openAlexAdapter: SourceAdapter = {
  capabilities: {
    id: "openalex",
    name: "OpenAlex",
    domainCoverage: "broad_discovery",
    requiresApiKey: false,
  },

  async search(params: SourceSearchParams): Promise<NormalizedRecord[]> {
    const fetchedAt = new Date().toISOString();
    const data = (await fetchJson(buildSearchUrl(params), {
      ...fetchOptions,
      source: "openalex",
    })) as OpenAlexResponse;
    return (data.results ?? []).map((work) => toNormalizedRecord(work, fetchedAt));
  },

  async checkStatus(): Promise<SourceStatus> {
    const checkedAt = new Date().toISOString();
    try {
      await fetchJson(buildSearchUrl({ query: "science", limit: 1 }), {
        ...fetchOptions,
        source: "openalex",
        maxRetries: 0,
        timeoutMs: 5000,
      });
      return { source: "openalex", ok: true, checkedAt };
    } catch (error) {
      return {
        source: "openalex",
        ok: false,
        checkedAt,
        error: error instanceof Error ? error.message : "unknown error",
      };
    }
  },
};

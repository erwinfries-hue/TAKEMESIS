import type { SourceId } from "./types";

/**
 * Approximate total database size per source — descriptive only, not
 * something any adapter can query live. Manually sourced from each
 * provider's own published statistics (not invented, per CLAUDE.md's
 * evidence-integrity rule against fabricating source coverage) and must be
 * refreshed periodically since these grow continuously; `asOf` records when
 * each figure was last checked so staleness is visible rather than implied
 * to be current forever.
 */
export interface CorpusSize {
  approxCount: number;
  asOf: string;
  sourceUrl: string;
}

export const CORPUS_SIZES: Partial<Record<SourceId, CorpusSize>> = {
  openalex: {
    approxCount: 477_000_000,
    asOf: "2026-01",
    sourceUrl: "https://blog.openalex.org/openalex-2026-roadmap/",
  },
  crossref: {
    approxCount: 180_000_000,
    asOf: "2026-03",
    sourceUrl: "https://www.crossref.org/blog/2026-public-data-file-now-available/",
  },
  europe_pmc: {
    approxCount: 46_000_000,
    asOf: "2026",
    sourceUrl: "https://www.ebi.ac.uk/training/online/courses/europepmc-quick-tour/what-is-europe-pmc/",
  },
  ncbi_pubmed: {
    approxCount: 40_000_000,
    asOf: "2026",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/about/",
  },
  arxiv: {
    approxCount: 3_100_000,
    asOf: "2026-07",
    sourceUrl: "https://blog.arxiv.org/2026/07/09/arxiv-now-hosts-over-3-million-articles/",
  },
};

const INTL_LOCALE: Record<"de" | "en" | "fr", string> = {
  de: "de-CH",
  en: "en-US",
  fr: "fr-CH",
};

const MILLIONS_SUFFIX: Record<"de" | "en" | "fr", (formatted: string) => string> = {
  de: (formatted) => `${formatted} Mio.`,
  en: (formatted) => `${formatted}M`,
  fr: (formatted) => `${formatted} mio`,
};

/** "477 Mio." / "3,1 Mio." / "477 mio" — always rounded, never a false-precision exact figure. */
export function formatApproxCount(count: number, locale: "de" | "en" | "fr"): string {
  const millions = count / 1_000_000;
  const rounded = millions >= 100 ? Math.round(millions) : Math.round(millions * 10) / 10;
  const formatted = rounded.toLocaleString(INTL_LOCALE[locale]);
  return MILLIONS_SUFFIX[locale](formatted);
}

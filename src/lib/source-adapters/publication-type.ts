import type { PublicationType } from "./types";

/**
 * Best-effort study-design signal from title/type text. Scholarly search
 * APIs return a coarse document *type* (article/review/preprint), not a
 * study *design* (RCT/cohort/meta-analysis) — inferring the latter reliably
 * generally needs full-text/abstract NLP. This is a conservative keyword
 * heuristic only: it returns "unknown" rather than guessing when nothing
 * matches, per the evidence-integrity rule against inventing methods.
 */
export function inferPublicationType(...texts: Array<string | null | undefined>): PublicationType {
  const combined = texts.filter(Boolean).join(" ").toLowerCase();

  if (combined.includes("meta-analysis") || combined.includes("meta analysis")) {
    return "meta_analysis";
  }
  if (combined.includes("systematic review")) {
    return "systematic_review";
  }
  if (
    combined.includes("randomized controlled trial") ||
    combined.includes("randomised controlled trial") ||
    /\brct\b/.test(combined)
  ) {
    return "rct";
  }
  if (combined.includes("quasi-experimental") || combined.includes("quasi experimental")) {
    return "quasi_experimental";
  }
  if (
    combined.includes("cohort study") ||
    combined.includes("prospective cohort") ||
    combined.includes("retrospective cohort")
  ) {
    return "cohort";
  }
  if (combined.includes("case-control") || combined.includes("case control")) {
    return "case_control";
  }
  if (combined.includes("cross-sectional") || combined.includes("cross sectional")) {
    return "cross_sectional";
  }
  if (combined.includes("case report")) {
    return "case_report";
  }
  if (combined.includes("review")) {
    return "review";
  }
  return "unknown";
}

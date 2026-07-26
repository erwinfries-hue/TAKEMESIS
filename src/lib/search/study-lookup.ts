/**
 * DOI-shaped, per the general registrant-code/suffix pattern
 * (https://www.doi.org/doi_handbook/2_Numbering.html) — deliberately loose
 * on the suffix (DOIs allow almost any character there) rather than trying
 * to fully validate, since the real validation is the lookup itself
 * returning a record or not.
 */
const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/i;

/**
 * Accepts what a user is likely to paste for "I already have a study":
 * a bare DOI, a doi.org URL, or a "doi:" prefixed value — with the
 * incidental whitespace/punctuation that comes from copy-pasting out of a
 * PDF or reference list. Returns null for anything that doesn't look like
 * a DOI at all, so the caller can show an honest "not a DOI" state instead
 * of attempting a lookup that could never succeed.
 */
export function parseDoiInput(raw: string): string | null {
  let candidate = raw.trim();
  if (!candidate) {
    return null;
  }
  candidate = candidate.replace(/^doi:\s*/i, "");
  candidate = candidate.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  candidate = candidate.replace(/[.,;]+$/, "");

  return DOI_PATTERN.test(candidate) ? candidate : null;
}

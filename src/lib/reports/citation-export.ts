import type { PremiumSourceEntry } from "./premium-report";

function escapeBibtex(value: string): string {
  return value.replace(/[{}]/g, "");
}

function bibtexKey(entry: PremiumSourceEntry, index: number): string {
  const firstAuthor = entry.authors[0]?.split(/\s+/).pop() ?? "tekmesis";
  const year = entry.year ?? "n_d";
  return `${firstAuthor.replace(/[^A-Za-z0-9]/g, "")}${year}_${index + 1}`;
}

/** Generic @misc entries — the report only has journal-agnostic metadata (no volume/issue/pages), so a more specific BibTeX type would imply structure that isn't there. */
export function toBibtex(entries: PremiumSourceEntry[]): string {
  return entries
    .map((entry, index) => {
      const fields: string[] = [];
      if (entry.title) fields.push(`  title = {${escapeBibtex(entry.title)}}`);
      if (entry.authors.length > 0) fields.push(`  author = {${escapeBibtex(entry.authors.join(" and "))}}`);
      if (entry.year) fields.push(`  year = {${entry.year}}`);
      if (entry.venue) fields.push(`  howpublished = {${escapeBibtex(entry.venue)}}`);
      if (entry.doi) fields.push(`  doi = {${entry.doi}}`);
      if (entry.sourceUrl) fields.push(`  url = {${entry.sourceUrl}}`);
      return `@misc{${bibtexKey(entry, index)},\n${fields.join(",\n")}\n}`;
    })
    .join("\n\n");
}

/** RIS "GEN" (generic) type for the same reason — no journal-specific fields are available to justify a JOUR/CONF-specific type. */
export function toRis(entries: PremiumSourceEntry[]): string {
  return entries
    .map((entry) => {
      const lines: string[] = ["TY  - GEN"];
      if (entry.title) lines.push(`TI  - ${entry.title}`);
      for (const author of entry.authors) lines.push(`AU  - ${author}`);
      if (entry.year) lines.push(`PY  - ${entry.year}`);
      if (entry.venue) lines.push(`T2  - ${entry.venue}`);
      if (entry.doi) lines.push(`DO  - ${entry.doi}`);
      if (entry.sourceUrl) lines.push(`UR  - ${entry.sourceUrl}`);
      lines.push("ER  - ");
      return lines.join("\n");
    })
    .join("\n\n");
}

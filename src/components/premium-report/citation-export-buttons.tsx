"use client";

import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { PremiumSourceEntry } from "@/lib/reports/premium-report";
import { toBibtex, toRis } from "@/lib/reports/citation-export";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function CitationExportButtons({
  dict,
  sources,
}: {
  dict: Dictionary;
  sources: PremiumSourceEntry[];
}) {
  const p = dict.premiumReportPage;
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <span className="text-xs font-medium text-brand-neutral-600">{p.exportCitationsHeading}:</span>
      <button
        type="button"
        onClick={() => download("tekmesis-quellen.bib", toBibtex(sources))}
        className="rounded-full border border-brand-neutral-200 px-3 py-1 text-xs font-medium text-brand-navy-900 transition-colors hover:bg-brand-neutral-50"
      >
        {p.exportBibtexCta}
      </button>
      <button
        type="button"
        onClick={() => download("tekmesis-quellen.ris", toRis(sources))}
        className="rounded-full border border-brand-neutral-200 px-3 py-1 text-xs font-medium text-brand-navy-900 transition-colors hover:bg-brand-neutral-50"
      >
        {p.exportRisCta}
      </button>
    </div>
  );
}

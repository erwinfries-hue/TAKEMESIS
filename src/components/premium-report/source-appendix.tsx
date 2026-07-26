import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { PremiumSourceEntry } from "@/lib/reports/premium-report";

export function SourceAppendix({
  dict,
  sources,
}: {
  dict: Dictionary;
  sources: PremiumSourceEntry[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-brand-neutral-950">
        {dict.premiumReportPage.sourceAppendixHeading} ({sources.length})
      </h3>
      <ol className="flex flex-col gap-2 text-sm text-brand-neutral-600">
        {sources.map((source, index) => (
          <li key={index}>
            {index + 1}.{" "}
            {source.sourceUrl ? (
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-teal-700 hover:underline"
              >
                {source.citation}
              </a>
            ) : (
              source.citation
            )}
            {source.doi ? ` · DOI: ${source.doi}` : ""}
          </li>
        ))}
      </ol>
    </div>
  );
}

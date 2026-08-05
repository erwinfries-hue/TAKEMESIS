import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { EvidencePassportData } from "@/lib/eligibility/evidence-passport";

/**
 * Standardized, multi-dimension "Evidenz-Profil" card — a recognizable trust
 * format shown identically in the free teaser (compact) and the paid report
 * (full), so the same dimensions are learnable across every search rather
 * than being scattered one-off stats. "compact" shows only what's cheap to
 * scan pre-purchase; "full" adds the paid-only dimensions plus the two the
 * catalog envisioned but this pipeline can't yet compute honestly
 * (consistency, transferability — both need AI-based structured extraction
 * that isn't wired up), shown as an explicit "not reported" rather than
 * invented.
 */
export function EvidencePassport({
  dict,
  passport,
  variant = "compact",
}: {
  dict: Dictionary;
  passport: EvidencePassportData;
  variant?: "compact" | "full";
}) {
  const p = dict.evidencePassport;

  const studyDesignValue = passport.studyTypeDistribution
    .map((entry) => `${entry.count}× ${dict.publicationTypeLabels[entry.type]}`)
    .join(", ");

  const sourceCoverageValue = p.sourceCoverageValue
    .replace("{searched}", String(passport.sourcesSearchedCount))
    .replace("{total}", String(passport.sourcesTotalCount));

  return (
    <div className="rounded-xl border border-brand-neutral-200 bg-white p-5">
      <h3 className="font-semibold text-brand-navy-900">{p.heading}</h3>
      <p className="mt-1 text-xs text-brand-neutral-600">{p.intro}</p>
      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-brand-neutral-600">{p.confidenceLabel}</dt>
          <dd className="font-medium text-brand-navy-900">
            {dict.confidenceLabels[passport.confidenceLabel]}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-brand-neutral-600">{p.studyDesignLabel}</dt>
          <dd className="font-medium text-brand-navy-900">{studyDesignValue}</dd>
        </div>
        <div>
          <dt className="text-xs text-brand-neutral-600">{p.sourceCoverageLabel}</dt>
          <dd className="font-medium text-brand-navy-900">{sourceCoverageValue}</dd>
        </div>

        {variant === "full" && (
          <>
            <div>
              <dt className="text-xs text-brand-neutral-600">{p.analysisBasisLabel}</dt>
              <dd className="font-medium text-brand-navy-900">
                {passport.analysisBasisDistribution
                  .map((entry) => `${entry.count}× ${dict.dataCompletenessLabels[entry.level]}`)
                  .join(", ")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-brand-neutral-600">{p.recencyLabel}</dt>
              <dd className="font-medium text-brand-navy-900">
                {passport.publicationYearRange.earliest !== null &&
                passport.publicationYearRange.latest !== null
                  ? p.recencyValue
                      .replace("{earliest}", String(passport.publicationYearRange.earliest))
                      .replace("{latest}", String(passport.publicationYearRange.latest))
                  : p.recencyNotAvailable}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-brand-neutral-600">{p.integrityLabel}</dt>
              <dd className="font-medium text-brand-navy-900">
                {passport.correctedStudyCount === 0
                  ? p.integrityClean
                  : p.integrityHasCorrections
                      .replace("{count}", String(passport.correctedStudyCount))
                      .replace("{total}", String(passport.includedCount))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-brand-neutral-600">{p.consistencyLabel}</dt>
              <dd className="text-sm text-brand-neutral-600">{p.notReportedNote}</dd>
            </div>
            <div>
              <dt className="text-xs text-brand-neutral-600">{p.transferabilityLabel}</dt>
              <dd className="text-sm text-brand-neutral-600">{p.notReportedNote}</dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
}

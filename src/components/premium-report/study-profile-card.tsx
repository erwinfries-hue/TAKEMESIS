import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { PremiumStudyProfile } from "@/lib/reports/premium-report";
import { orNotReported } from "./format";

export function StudyProfileCard({
  dict,
  profile,
}: {
  dict: Dictionary;
  profile: PremiumStudyProfile;
}) {
  const notReported = dict.premiumReportPage.notReported;
  const fields: Array<[string, string | null]> = [
    [dict.premiumReportPage.profilePopulationLabel, profile.population],
    [dict.premiumReportPage.profileInterventionLabel, profile.intervention],
    [dict.premiumReportPage.profileOutcomeLabel, profile.outcome],
    [dict.premiumReportPage.profileResultLabel, profile.result],
    [dict.premiumReportPage.profileUncertaintyLabel, profile.uncertainty],
    [dict.premiumReportPage.profileLimitationsLabel, profile.limitations],
    [dict.premiumReportPage.profileFundingLabel, profile.fundingConflicts],
  ];

  return (
    <article className="rounded-xl border border-brand-neutral-200 bg-white p-5">
      <p className="font-medium text-brand-navy-900">{profile.citation}</p>
      <p className="mt-1 text-sm text-brand-neutral-600">
        {dict.premiumReportPage.profileDesignLabel}: {dict.publicationTypeLabels[profile.design]}
      </p>

      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="font-medium text-brand-neutral-950">{label}</dt>
            <dd className="text-brand-neutral-600">{orNotReported(value, notReported)}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs text-brand-neutral-600">
        {dict.premiumReportPage.profileProvenanceLabel}:{" "}
        {profile.sourceUrl ? (
          <a
            href={profile.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-teal-700 hover:underline"
          >
            {profile.source}
          </a>
        ) : (
          profile.source
        )}
        {profile.doi ? ` · DOI: ${profile.doi}` : ""}
      </p>
    </article>
  );
}

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { EvidencePassportData } from "@/lib/eligibility/evidence-passport";
import { EvidencePassport } from "./evidence-passport";

const dict = getDictionary("de");

const basePassport: EvidencePassportData = {
  confidenceLabel: "moderate",
  studyTypeDistribution: [
    { type: "rct", count: 3 },
    { type: "cohort", count: 1 },
  ],
  analysisBasisDistribution: [
    { level: "abstract", count: 3 },
    { level: "metadata_only", count: 1 },
  ],
  sourcesSearchedCount: 3,
  sourcesTotalCount: 4,
  publicationYearRange: { earliest: 2018, latest: 2024 },
  correctedStudyCount: 0,
  includedCount: 4,
};

describe("EvidencePassport", () => {
  it("renders the heading and core dimensions in compact mode", () => {
    render(<EvidencePassport dict={dict} passport={basePassport} variant="compact" />);
    expect(screen.getByText(dict.evidencePassport.heading)).toBeInTheDocument();
    expect(screen.getByText(dict.confidenceLabels.moderate)).toBeInTheDocument();
    expect(screen.getByText("3 von 4 Quellen durchsucht")).toBeInTheDocument();
  });

  it("does not render the paid-only dimensions in compact mode", () => {
    render(<EvidencePassport dict={dict} passport={basePassport} variant="compact" />);
    expect(screen.queryByText(dict.evidencePassport.analysisBasisLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(dict.evidencePassport.integrityLabel)).not.toBeInTheDocument();
  });

  it("renders the additional dimensions in full mode, including the honest not-reported placeholders", () => {
    render(<EvidencePassport dict={dict} passport={basePassport} variant="full" />);
    expect(screen.getByText(dict.evidencePassport.analysisBasisLabel)).toBeInTheDocument();
    expect(screen.getByText("2018–2024")).toBeInTheDocument();
    expect(screen.getByText(dict.evidencePassport.integrityClean)).toBeInTheDocument();
    expect(screen.getAllByText(dict.evidencePassport.notReportedNote)).toHaveLength(2);
  });

  it("shows a correction count instead of the clean message when studies were corrected", () => {
    const passport: EvidencePassportData = { ...basePassport, correctedStudyCount: 1 };
    render(<EvidencePassport dict={dict} passport={passport} variant="full" />);
    expect(screen.getByText("1 von 4 Studien mit bekannter Korrektur")).toBeInTheDocument();
  });

  it("shows the not-available note when no publication years are known", () => {
    const passport: EvidencePassportData = {
      ...basePassport,
      publicationYearRange: { earliest: null, latest: null },
    };
    render(<EvidencePassport dict={dict} passport={passport} variant="full" />);
    expect(screen.getByText(dict.evidencePassport.recencyNotAvailable)).toBeInTheDocument();
  });
});

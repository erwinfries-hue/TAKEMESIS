import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { NotResearchableNotice } from "./not-researchable-notice";

const dict = getDictionary("de");

describe("NotResearchableNotice", () => {
  it("renders the researchability-specific heading and body, distinct from NotEligibleNotice's", () => {
    render(<NotResearchableNotice dict={dict} locale="de" />);
    expect(screen.getByText(dict.notResearchablePage.heading)).toBeInTheDocument();
    expect(screen.getByText(dict.notResearchablePage.body)).toBeInTheDocument();
    expect(screen.queryByText(dict.notEligiblePage.heading)).not.toBeInTheDocument();
  });

  it("includes the phrasing tips and a link back to /topics", () => {
    render(<NotResearchableNotice dict={dict} locale="de" />);
    expect(screen.getByText(dict.questionPhrasingTips.toggleLabel)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: dict.notResearchablePage.refineCta })).toHaveAttribute(
      "href",
      "/de/topics",
    );
  });
});

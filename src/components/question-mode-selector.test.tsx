import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { QuestionModeSelector } from "./question-mode-selector";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const dict = getDictionary("de");

describe("QuestionModeSelector", () => {
  it("defaults to the own-question tab, with its field visible and the DOI field hidden", () => {
    render(<QuestionModeSelector dict={dict} locale="de" />);

    expect(screen.getByRole("tab", { name: dict.ownQuestionForm.heading })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByLabelText(dict.ownQuestionForm.label)).toBeInTheDocument();
    expect(screen.queryByLabelText(dict.studyLookupForm.label)).not.toBeInTheDocument();
  });

  it("switches to the DOI lookup tab on click", () => {
    render(<QuestionModeSelector dict={dict} locale="de" />);

    fireEvent.click(screen.getByRole("tab", { name: dict.studyLookupForm.heading }));

    expect(screen.getByRole("tab", { name: dict.studyLookupForm.heading })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByLabelText(dict.studyLookupForm.label)).toBeInTheDocument();
    expect(screen.queryByLabelText(dict.ownQuestionForm.label)).not.toBeInTheDocument();
  });

  it("passes hideHeading through so each form's own <h2> is suppressed", () => {
    render(<QuestionModeSelector dict={dict} locale="de" />);
    expect(
      screen.queryByRole("heading", { name: dict.ownQuestionForm.heading }),
    ).not.toBeInTheDocument();
  });

  it("labels the tablist for screen readers", () => {
    render(<QuestionModeSelector dict={dict} locale="de" />);
    expect(screen.getByRole("tablist")).toHaveAccessibleName(dict.questionModeSelector.tabListLabel);
  });
});

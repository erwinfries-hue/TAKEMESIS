import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { NotEligibleNotice } from "./not-eligible-notice";

const dict = getDictionary("de");

describe("NotEligibleNotice", () => {
  it("renders the generic guidance without an exampleTopic", () => {
    render(<NotEligibleNotice dict={dict} />);
    expect(screen.getByText(dict.notEligiblePage.heading)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: dict.notEligiblePage.refineCta })).toBeInTheDocument();
  });

  it("shows up to 3 example questions from the same topic when provided", () => {
    render(
      <NotEligibleNotice
        dict={dict}
        exampleTopic={{
          name: "Schlaf & Regeneration",
          examples: ["Frage eins?", "Frage zwei?", "Frage drei?", "Frage vier?"],
        }}
      />,
    );
    expect(
      screen.getByText(dict.notEligiblePage.exampleQuestionsHeading.replace("{topic}", "Schlaf & Regeneration")),
    ).toBeInTheDocument();
    expect(screen.getByText("Frage eins?")).toBeInTheDocument();
    expect(screen.getByText("Frage zwei?")).toBeInTheDocument();
    expect(screen.getByText("Frage drei?")).toBeInTheDocument();
    expect(screen.queryByText("Frage vier?")).not.toBeInTheDocument();
  });

  it("does not render an example-questions section when exampleTopic is null", () => {
    render(<NotEligibleNotice dict={dict} exampleTopic={null} />);
    expect(screen.queryByText(/exampleQuestionsHeading/)).not.toBeInTheDocument();
  });

  it("does not render an example-questions section when examples is empty", () => {
    render(<NotEligibleNotice dict={dict} exampleTopic={{ name: "X", examples: [] }} />);
    expect(
      screen.queryByText(dict.notEligiblePage.exampleQuestionsHeading.replace("{topic}", "X")),
    ).not.toBeInTheDocument();
  });

  it("each example question links to /topics prefilled with that question", () => {
    render(
      <NotEligibleNotice
        dict={dict}
        exampleTopic={{ name: "Schlaf & Regeneration", examples: ["Wirkt Melatonin?"] }}
      />,
    );
    const link = screen.getByRole("link", { name: "Wirkt Melatonin?" });
    expect(link).toHaveAttribute("href", expect.stringContaining(encodeURIComponent("Wirkt Melatonin?")));
  });
});

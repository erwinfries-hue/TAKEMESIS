import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { QuestionPhrasingTips } from "./question-phrasing-tips";

const dict = getDictionary("de").questionPhrasingTips;

describe("QuestionPhrasingTips", () => {
  it("renders the toggle label", () => {
    render(<QuestionPhrasingTips dict={dict} />);
    expect(screen.getByText(dict.toggleLabel)).toBeInTheDocument();
  });

  it("renders every tip", () => {
    render(<QuestionPhrasingTips dict={dict} />);
    for (const tip of dict.tips) {
      expect(screen.getByText(tip)).toBeInTheDocument();
    }
  });

  it("is collapsed by default (details, not open)", () => {
    render(<QuestionPhrasingTips dict={dict} />);
    const details = screen.getByText(dict.toggleLabel).closest("details");
    expect(details).not.toHaveAttribute("open");
  });
});

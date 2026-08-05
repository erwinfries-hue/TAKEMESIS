import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { QuestionClarification, type CandidateOption } from "./question-clarification";

const dict = getDictionary("de");

const topicA: CandidateOption = { slug: "topic-a", name: "Topic A", riskProfile: "standard" };
const topicB: CandidateOption = { slug: "topic-b", name: "Topic B", riskProfile: "standard" };
const topicC: CandidateOption = { slug: "topic-c", name: "Topic C", riskProfile: "standard" };

describe("QuestionClarification", () => {
  it("pre-checks the classifier's top candidate when a domain was actually classified", () => {
    render(
      <QuestionClarification
        dict={dict}
        question="Welche Frage?"
        candidates={[topicA, topicB]}
        fallbackTopics={[topicA, topicB, topicC]}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Topic A" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Topic B" })).not.toBeChecked();
  });

  it("does not preselect any topic when nothing classified and the full fallback list is shown (live bug, 2026-08-05)", () => {
    render(
      <QuestionClarification
        dict={dict}
        question="Welche Frage?"
        candidates={[]}
        fallbackTopics={[topicA, topicB, topicC]}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Topic A" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Topic B" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Topic C" })).not.toBeChecked();
  });
});

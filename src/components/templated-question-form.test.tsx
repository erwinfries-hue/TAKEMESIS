import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { TemplatedQuestionForm } from "./templated-question-form";

const dict = getDictionary("de");

describe("TemplatedQuestionForm", () => {
  it("renders both keyword labels", () => {
    render(<TemplatedQuestionForm dict={dict} locale="de" />);
    expect(screen.getByLabelText(dict.templatedQuestionForm.measureLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(dict.templatedQuestionForm.outcomeLabel)).toBeInTheDocument();
  });

  it("disables submit until both fields are filled", () => {
    render(<TemplatedQuestionForm dict={dict} locale="de" />);
    const submit = screen.getByRole("button", { name: dict.ownQuestionForm.submit });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(dict.templatedQuestionForm.measureLabel), {
      target: { value: "regelmässige Bewegung" },
    });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(dict.templatedQuestionForm.outcomeLabel), {
      target: { value: "das Erkrankungsrisiko" },
    });
    expect(submit).not.toBeDisabled();
  });

  it("shows a live preview of the assembled question", () => {
    render(<TemplatedQuestionForm dict={dict} locale="de" />);
    fireEvent.change(screen.getByLabelText(dict.templatedQuestionForm.measureLabel), {
      target: { value: "regelmässige Bewegung" },
    });
    fireEvent.change(screen.getByLabelText(dict.templatedQuestionForm.outcomeLabel), {
      target: { value: "das Erkrankungsrisiko" },
    });
    expect(
      screen.getByText("Welchen Effekt hat regelmässige Bewegung auf das Erkrankungsrisiko?"),
    ).toBeInTheDocument();
  });

  it("carries the assembled question in a hidden q input for the native GET submit", () => {
    const { container } = render(<TemplatedQuestionForm dict={dict} locale="de" />);
    fireEvent.change(screen.getByLabelText(dict.templatedQuestionForm.measureLabel), {
      target: { value: "Bewegung" },
    });
    fireEvent.change(screen.getByLabelText(dict.templatedQuestionForm.outcomeLabel), {
      target: { value: "Risiko" },
    });
    const hiddenInput = container.querySelector('input[type="hidden"][name="q"]');
    expect(hiddenInput).toHaveValue("Welchen Effekt hat Bewegung auf Risiko?");
  });

  it("suppresses its own heading when hideHeading is set", () => {
    render(<TemplatedQuestionForm dict={dict} locale="de" hideHeading />);
    expect(
      screen.queryByRole("heading", { name: dict.templatedQuestionForm.heading }),
    ).not.toBeInTheDocument();
  });
});

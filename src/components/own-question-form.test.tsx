import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { MAX_QUESTION_LENGTH } from "@/lib/security/limits";
import { OwnQuestionForm } from "./own-question-form";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const dict = getDictionary("de");

describe("OwnQuestionForm", () => {
  it("does not show a character count for a short question", () => {
    render(<OwnQuestionForm dict={dict} locale="de" />);
    const textarea = screen.getByLabelText(dict.ownQuestionForm.label);
    fireEvent.change(textarea, { target: { value: "Kurze Frage" } });
    expect(screen.queryByText(/\/ 500/)).not.toBeInTheDocument();
  });

  it("shows a character count once the question is mostly full (>80% of the max)", () => {
    render(<OwnQuestionForm dict={dict} locale="de" />);
    const textarea = screen.getByLabelText(dict.ownQuestionForm.label);
    const longValue = "x".repeat(Math.floor(MAX_QUESTION_LENGTH * 0.8) + 1);
    fireEvent.change(textarea, { target: { value: longValue } });
    expect(
      screen.getByText(`${longValue.length} / ${MAX_QUESTION_LENGTH} Zeichen`),
    ).toBeInTheDocument();
  });

  it("submits the form on Cmd/Ctrl+Enter", () => {
    render(<OwnQuestionForm dict={dict} locale="de" />);
    const textarea = screen.getByLabelText(dict.ownQuestionForm.label);
    fireEvent.change(textarea, { target: { value: "Welche Lernmethode wirkt?" } });

    const form = textarea.closest("form");
    if (!form) throw new Error("form not found");
    const requestSubmit = vi.fn();
    form.requestSubmit = requestSubmit;

    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not submit on plain Enter, so it stays a newline", () => {
    render(<OwnQuestionForm dict={dict} locale="de" />);
    const textarea = screen.getByLabelText(dict.ownQuestionForm.label);
    fireEvent.change(textarea, { target: { value: "Welche Lernmethode wirkt?" } });

    const form = textarea.closest("form");
    if (!form) throw new Error("form not found");
    const requestSubmit = vi.fn();
    form.requestSubmit = requestSubmit;

    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(requestSubmit).not.toHaveBeenCalled();
  });
});

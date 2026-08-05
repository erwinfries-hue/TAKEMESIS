import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { VoiceInputButton } from "./voice-input-button";

/** Minimal fake matching the Web Speech API surface voice-input-button.tsx actually uses. */
class FakeSpeechRecognition {
  lang = "";
  interimResults = false;
  continuous = false;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null = null;
  onerror: (() => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
}

let lastInstance: FakeSpeechRecognition | null = null;

function installFakeSpeechRecognition() {
  lastInstance = null;
  function Constructor(this: FakeSpeechRecognition) {
    lastInstance = new FakeSpeechRecognition();
    return lastInstance;
  }
  (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = Constructor;
  return Constructor;
}

afterEach(() => {
  delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  lastInstance = null;
});

describe("VoiceInputButton", () => {
  it("renders nothing when the browser has no SpeechRecognition API", () => {
    const { container } = render(
      <VoiceInputButton lang="de-CH" onResult={vi.fn()} ariaLabel="Diktieren" listeningLabel="Hört zu" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a mic button when SpeechRecognition is available", () => {
    installFakeSpeechRecognition();
    render(<VoiceInputButton lang="de-CH" onResult={vi.fn()} ariaLabel="Diktieren" listeningLabel="Hört zu" />);
    expect(screen.getByRole("button", { name: "Diktieren" })).toBeInTheDocument();
  });

  it("also works via the webkit-prefixed constructor (Safari)", () => {
    function Constructor() {
      return new FakeSpeechRecognition();
    }
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition = Constructor;
    render(<VoiceInputButton lang="de-CH" onResult={vi.fn()} ariaLabel="Diktieren" listeningLabel="Hört zu" />);
    expect(screen.getByRole("button", { name: "Diktieren" })).toBeInTheDocument();
  });

  it("clicking starts recognition with the given lang and shows the listening state", () => {
    installFakeSpeechRecognition();
    render(<VoiceInputButton lang="fr-CH" onResult={vi.fn()} ariaLabel="Diktieren" listeningLabel="Hört zu" />);

    fireEvent.click(screen.getByRole("button", { name: "Diktieren" }));

    expect(lastInstance?.start).toHaveBeenCalledTimes(1);
    expect(lastInstance?.lang).toBe("fr-CH");
    expect(screen.getByRole("button", { name: "Hört zu" })).toHaveAttribute("aria-pressed", "true");
  });

  it("delivers the recognized transcript via onResult", () => {
    installFakeSpeechRecognition();
    const onResult = vi.fn();
    render(<VoiceInputButton lang="de-CH" onResult={onResult} ariaLabel="Diktieren" listeningLabel="Hört zu" />);

    fireEvent.click(screen.getByRole("button", { name: "Diktieren" }));
    lastInstance?.onresult?.({ results: [[{ transcript: "Welche Lernmethode wirkt?" }]] });

    expect(onResult).toHaveBeenCalledWith("Welche Lernmethode wirkt?");
  });

  it("clicking again while listening stops recognition", () => {
    installFakeSpeechRecognition();
    render(<VoiceInputButton lang="de-CH" onResult={vi.fn()} ariaLabel="Diktieren" listeningLabel="Hört zu" />);

    fireEvent.click(screen.getByRole("button", { name: "Diktieren" }));
    fireEvent.click(screen.getByRole("button", { name: "Hört zu" }));

    expect(lastInstance?.stop).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Diktieren" })).toHaveAttribute("aria-pressed", "false");
  });

  it("resets the listening state on a recognition error", () => {
    installFakeSpeechRecognition();
    render(<VoiceInputButton lang="de-CH" onResult={vi.fn()} ariaLabel="Diktieren" listeningLabel="Hört zu" />);

    fireEvent.click(screen.getByRole("button", { name: "Diktieren" }));
    act(() => {
      lastInstance?.onerror?.();
    });

    expect(screen.getByRole("button", { name: "Diktieren" })).toHaveAttribute("aria-pressed", "false");
  });

  it("resets the listening state when recognition ends on its own", () => {
    installFakeSpeechRecognition();
    render(<VoiceInputButton lang="de-CH" onResult={vi.fn()} ariaLabel="Diktieren" listeningLabel="Hört zu" />);

    fireEvent.click(screen.getByRole("button", { name: "Diktieren" }));
    act(() => {
      lastInstance?.onend?.();
    });

    expect(screen.getByRole("button", { name: "Diktieren" })).toHaveAttribute("aria-pressed", "false");
  });
});

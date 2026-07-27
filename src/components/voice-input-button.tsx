"use client";

import { useEffect, useRef, useState } from "react";
import { useBrowserFeatureSupported } from "@/lib/browser/use-browser-feature";

/** Minimal shape of the (still not fully standardized) Web Speech API — no @types/dom-speech-recognition dependency, just the handful of members actually used. */
interface MinimalSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Hidden entirely (not shown-but-disabled) on browsers without the Web Speech API — currently Chrome/Edge/Safari but not Firefox. */
export function VoiceInputButton({
  lang,
  onResult,
  ariaLabel,
  listeningLabel,
}: {
  lang: string;
  onResult: (transcript: string) => void;
  ariaLabel: string;
  listeningLabel: string;
}) {
  const supported = useBrowserFeatureSupported(() => getSpeechRecognitionConstructor() !== null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  if (!supported) {
    return null;
  }

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Constructor = getSpeechRecognitionConstructor();
    if (!Constructor) return;
    const recognition = new Constructor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={listening}
      aria-label={listening ? listeningLabel : ariaLabel}
      title={listening ? listeningLabel : ariaLabel}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
        listening
          ? "border-brand-warning-500 bg-brand-warning-100 text-brand-warning-600"
          : "border-brand-neutral-200 text-brand-neutral-600 hover:bg-brand-neutral-50"
      }`}
    >
      <span aria-hidden="true">🎤</span>
    </button>
  );
}

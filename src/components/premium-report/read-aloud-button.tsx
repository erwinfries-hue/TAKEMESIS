"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { SPEECH_LOCALE } from "@/lib/i18n/speech-locale";
import { useBrowserFeatureSupported } from "@/lib/browser/use-browser-feature";

/** Browser-native SpeechSynthesis — no server round-trip, no extra dependency. Silently unavailable (button hidden) rather than shown-but-broken where the API doesn't exist (e.g. some older mobile browsers). */
export function ReadAloudButton({
  dict,
  locale,
  text,
}: {
  dict: Dictionary;
  locale: Locale;
  text: string;
}) {
  const [speaking, setSpeaking] = useState(false);
  const supported = useBrowserFeatureSupported(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported || text.trim().length === 0) {
    return null;
  }

  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALE[locale];
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-neutral-200 px-3 py-1 text-xs font-medium text-brand-navy-900 transition-colors hover:bg-brand-neutral-50 print:hidden"
    >
      <span aria-hidden="true">{speaking ? "⏹" : "🔊"}</span>
      {speaking ? dict.premiumReportPage.readAloudStopCta : dict.premiumReportPage.readAloudCta}
    </button>
  );
}

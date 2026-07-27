"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { PremiumComparisonRow, PremiumStudyProfile } from "@/lib/reports/premium-report";

interface ChatMessage {
  question: string;
  answer: string;
  answerableFromReport: boolean;
}

function toStudyInput(profiles: PremiumStudyProfile[], comparison: PremiumComparisonRow[]) {
  return profiles.map((profile, index) => ({
    citation: profile.citation,
    design: profile.design,
    fields: {
      population: profile.population,
      intervention: profile.intervention,
      outcome: profile.outcome,
      result: profile.result ?? comparison[index]?.keyFinding ?? null,
      uncertainty: profile.uncertainty,
      limitations: profile.limitations,
      fundingConflicts: profile.fundingConflicts,
    },
  }));
}

/**
 * Only ever renders when the server-rendered parent decided AI is
 * configured (see premium-report-view.tsx) — this component itself has no
 * way to know that, it just calls the API route, which independently
 * re-checks and 503s if it isn't.
 */
export function ReportChatWidget({
  dict,
  originalQuestion,
  profiles,
  comparison,
}: {
  dict: Dictionary;
  originalQuestion: string;
  profiles: PremiumStudyProfile[];
  comparison: PremiumComparisonRow[];
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed.length === 0 || loading) return;

    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/report-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originalQuestion,
          followUpQuestion: trimmed,
          studies: toStudyInput(profiles, comparison),
        }),
      });
      if (!response.ok) {
        setError(true);
        return;
      }
      const result = (await response.json()) as { answer: string; answerableFromReport: boolean };
      setMessages((prev) => [...prev, { question: trimmed, ...result }]);
      setQuestion("");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-6 print:hidden">
      <div>
        <h3 className="font-semibold text-brand-navy-900">{dict.premiumReportPage.chatHeading}</h3>
        <p className="mt-1 text-sm text-brand-neutral-600">{dict.premiumReportPage.chatIntro}</p>
      </div>

      {messages.length > 0 && (
        <ul className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <li key={index} className="rounded-lg bg-brand-neutral-50 p-3 text-sm">
              <p className="font-medium text-brand-navy-900">{message.question}</p>
              <p className="mt-1 text-brand-neutral-600">{message.answer}</p>
              {!message.answerableFromReport && (
                <p className="mt-1 text-xs text-brand-warning-600">
                  {dict.premiumReportPage.chatNotAnswerableNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {loading && <p className="text-xs text-brand-neutral-600">{dict.premiumReportPage.chatLoading}</p>}
      {error && <p className="text-xs text-brand-warning-600">{dict.premiumReportPage.chatError}</p>}

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={dict.premiumReportPage.chatInputPlaceholder}
          className="min-w-0 flex-1 rounded-lg border border-brand-neutral-200 p-2 text-sm focus:border-brand-teal-600 focus:outline-none focus:ring-2 focus:ring-brand-teal-400"
        />
        <button
          type="submit"
          disabled={loading || question.trim().length === 0}
          className="rounded-full bg-brand-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {dict.premiumReportPage.chatSubmitCta}
        </button>
      </form>
    </div>
  );
}

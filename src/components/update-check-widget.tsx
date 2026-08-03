"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type Status = "idle" | "loading" | "success" | "rate_limited" | "error";

/**
 * Evidence-Update-Check (decision #7): a one-time, user-triggered recheck,
 * not a recurring subscription (CLAUDE.md: "No subscription in MVP"). The
 * server route re-validates rate-limiting independently — `initiallyRateLimited`
 * only avoids showing a button that would just 409, same trust model as
 * report-chat-widget.tsx.
 */
export function UpdateCheckWidget({
  dict,
  token,
  email,
  initiallyRateLimited,
}: {
  dict: Dictionary["updateCheck"];
  token: string;
  email: string;
  /** Server-computed (update-check.ts's canRunUpdateCheck) — shows the rate-limit message up front instead of a button that would just 409. */
  initiallyRateLimited: boolean;
}) {
  const [status, setStatus] = useState<Status>(initiallyRateLimited ? "rate_limited" : "idle");
  const [newStudyCount, setNewStudyCount] = useState(0);

  async function handleClick() {
    setStatus("loading");
    try {
      const response = await fetch(`/api/report/${token}/check-updates`, { method: "POST" });
      if (response.status === 409) {
        setStatus("rate_limited");
        return;
      }
      if (!response.ok) {
        setStatus("error");
        return;
      }
      const body = (await response.json()) as { newStudyCount: number };
      setNewStudyCount(body.newStudyCount);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-brand-navy-900">{dict.heading}</h2>

      {status === "idle" && (
        <>
          <p className="text-sm text-brand-neutral-600">
            {dict.description.replace("{email}", email)}
          </p>
          <button
            type="button"
            onClick={handleClick}
            className="self-start rounded-full bg-brand-navy-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
          >
            {dict.buttonLabel}
          </button>
        </>
      )}

      {status === "loading" && (
        <p role="status" className="text-sm text-brand-neutral-600">
          {dict.loadingLabel}
        </p>
      )}

      {status === "success" && (
        <div role="status" className="flex flex-col gap-1">
          <p className="font-semibold text-brand-navy-900">
            {newStudyCount > 0 ? dict.successHeadingFound : dict.successHeadingNone}
          </p>
          <p className="text-sm text-brand-neutral-600">
            {newStudyCount > 0
              ? dict.successBodyFound.replace("{count}", String(newStudyCount))
              : dict.successBodyNone}
          </p>
        </div>
      )}

      {status === "rate_limited" && (
        <p className="text-sm text-brand-neutral-600">{dict.rateLimitedBody}</p>
      )}

      {status === "error" && <p className="text-sm text-brand-warning-600">{dict.errorBody}</p>}

      <p className="text-xs text-brand-neutral-600">{dict.note}</p>
    </div>
  );
}

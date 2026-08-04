"use client";

import { useId, useState, type FormEvent } from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type Status = "idle" | "loading" | "success" | "rate_limited" | "error";

/**
 * Per-topic opt-in for the Themen-Digest (docs/OPEN_RISKS.md item #25's
 * 2026-08-04 decision) — placed on each topic card rather than one generic
 * site-wide form, so the subscription is anchored to the topic the visitor
 * was already looking at. Subscribing to a second topic elsewhere merges
 * into the same subscription server-side (topics/subscribe.ts); this
 * component only ever knows about its own topic.
 */
export function TopicDigestSignup({
  dict,
  locale,
  topicSlug,
}: {
  dict: Dictionary["topicDigestSignup"];
  locale: Locale;
  topicSlug: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const inputId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      const response = await fetch("/api/topics/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, topicSlug, locale }),
      });
      if (response.status === 429) {
        setStatus("rate_limited");
        return;
      }
      if (!response.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p role="status" className="text-sm text-brand-teal-700">
        {dict.successBody}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-brand-neutral-950">
        {dict.heading}
      </label>
      <p className="text-xs text-brand-neutral-600">{dict.description}</p>
      <div className="flex flex-wrap gap-2">
        <input
          id={inputId}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={dict.emailPlaceholder}
          disabled={status === "loading"}
          className="min-w-0 flex-1 rounded-lg border border-brand-neutral-200 p-2 text-sm text-brand-neutral-950 focus:border-brand-teal-600 focus:outline-none focus:ring-2 focus:ring-brand-teal-400"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-brand-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
        >
          {status === "loading" ? dict.loadingLabel : dict.submitLabel}
        </button>
      </div>
      {status === "rate_limited" && (
        <p className="text-xs text-brand-warning-600">{dict.rateLimitedBody}</p>
      )}
      {status === "error" && <p className="text-xs text-brand-warning-600">{dict.errorBody}</p>}
      <p className="text-xs text-brand-neutral-600">{dict.privacyNote}</p>
    </form>
  );
}

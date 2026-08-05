import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * Proactive guidance next to the own-question textarea — a real user
 * complaint (three questions in a row, no eligible report) traced back to
 * several distinct causes (query-translation gaps, a strict relevance
 * threshold on short questions, structurally weaker-coverage topics), none
 * of which a flat rejection message on failure explained. This can't
 * promise a match (CLAUDE.md: "unsupported questions must not be sold") —
 * it only nudges toward phrasing patterns the already-verified example
 * questions (docs/OPEN_RISKS.md #19/#27, `/admin/example-questions`) share.
 */
export function QuestionPhrasingTips({ dict }: { dict: Dictionary["questionPhrasingTips"] }) {
  return (
    <details className="rounded-lg border border-brand-neutral-100 bg-brand-neutral-50 px-3 py-2">
      <summary className="cursor-pointer text-xs font-medium text-brand-teal-700 hover:underline">
        {dict.toggleLabel}
      </summary>
      <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-xs text-brand-neutral-600">
        {dict.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </details>
  );
}

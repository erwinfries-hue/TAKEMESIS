import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/require-admin-session";
import { checkExampleQuestionsForTopic } from "@/lib/admin/example-question-check";
import { topics, topicCopy } from "@/content/topics";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Beispielfragen prüfen — Admin — TEKMESIS",
  robots: { index: false, follow: false },
};

// Live network calls to the real source APIs for one topic's worth of
// examples (5-8 sequential requests) — well past a default 10s serverless
// budget, so this route asks for more room. Whether Vercel's plan actually
// grants it depends on Erwin's Vercel tier; if it still times out, that's a
// plan limit, not a code bug (see docs/OPEN_RISKS.md).
export const maxDuration = 60;

const ELIGIBILITY_LABEL: Record<string, string> = {
  eligible: "Eignet sich",
  eligible_with_limitations: "Eignet sich (mit Einschränkungen)",
  not_eligible: "Eignet sich nicht",
};

export default async function ExampleQuestionsCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; locale?: string }>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const locale: Locale = isLocale(params.locale ?? "") ? (params.locale as Locale) : defaultLocale;
  const selectedTopic = params.topic && topics.some((t) => t.slug === params.topic) ? params.topic : null;

  const results = selectedTopic
    ? await checkExampleQuestionsForTopic(selectedTopic, locale)
    : null;

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-brand-navy-900">Beispielfragen live prüfen</h1>
        <Link href="/admin" className="text-sm text-brand-teal-700 hover:underline">
          Zurück zur Übersicht
        </Link>
      </div>

      <p className="max-w-2xl text-sm text-brand-neutral-600">
        Führt jede Beispielfrage eines Themas durch die echte Such- und Eignungsprüfung — mit
        echten Anfragen an die realen Quellen (OpenAlex, Crossref, Europe PMC, NCBI). Damit lässt
        sich prüfen, ob eine als Beispiel gezeigte Frage tatsächlich zu einem verkaufbaren Report
        führen würde, statt es anzunehmen. Läuft nur mit echtem Netzwerkzugriff (z. B. auf Vercel)
        zuverlässig — in einer Sandbox ohne Zugriff auf die Quellen zeigt jedes Ergebnis
        erwartungsgemäss &quot;Eignet sich nicht&quot; mit Quellenfehlern.
      </p>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-brand-neutral-950">Thema</span>
          <select
            name="topic"
            defaultValue={selectedTopic ?? ""}
            className="rounded-lg border border-brand-neutral-200 p-2"
          >
            <option value="" disabled>
              Thema wählen …
            </option>
            {topics.map((topic) => (
              <option key={topic.slug} value={topic.slug}>
                {topicCopy(topic, locale).name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-brand-neutral-950">Sprache</span>
          <select name="locale" defaultValue={locale} className="rounded-lg border border-brand-neutral-200 p-2">
            <option value="de">Deutsch</option>
            <option value="en">Englisch</option>
            <option value="fr">Französisch</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white hover:bg-brand-navy-800"
        >
          Prüfen
        </button>
      </form>

      {results && (
        <section>
          <h2 className="mb-3 font-semibold text-brand-navy-900">
            Ergebnisse: {topicCopy(topics.find((t) => t.slug === selectedTopic)!, locale).name}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-brand-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-neutral-200 text-brand-neutral-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">Frage</th>
                  <th className="px-3 py-2 font-semibold">Eignung</th>
                  <th className="px-3 py-2 font-semibold">Eingeschlossen</th>
                  <th className="px-3 py-2 font-semibold">Ergebnistragend</th>
                  <th className="px-3 py-2 font-semibold">Quellenfehler</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr
                    key={result.question}
                    className="border-b border-brand-neutral-100 align-top last:border-0"
                  >
                    <td className="px-3 py-2 text-brand-neutral-950">{result.question}</td>
                    <td className="px-3 py-2 font-medium text-brand-navy-900">
                      {ELIGIBILITY_LABEL[result.eligibility] ?? result.eligibility}
                    </td>
                    <td className="px-3 py-2 text-brand-neutral-600">{result.includedCount}</td>
                    <td className="px-3 py-2 text-brand-neutral-600">{result.resultBearingCount}</td>
                    <td className="px-3 py-2 text-brand-warning-600">
                      {result.sourceErrors.join(", ") || "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

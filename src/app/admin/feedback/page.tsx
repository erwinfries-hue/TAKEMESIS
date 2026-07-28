import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/require-admin-session";
import { describeUnknownError } from "@/lib/errors/describe-unknown-error";
import { SupabaseFeedbackRepository } from "@/lib/feedback/supabase-feedback-repository";
import { SupabaseIssueReportRepository } from "@/lib/feedback/supabase-issue-report-repository";
import type { FeedbackEntry, IssueReport } from "@/lib/feedback/types";
import { dismissIssueAction, resolveIssueAction } from "./actions";

export const metadata: Metadata = { title: "Admin — Feedback & Probleme — TEKMESIS" };

const ISSUE_STATUS_LABEL: Record<IssueReport["status"], string> = {
  open: "Offen",
  resolved: "Gelöst",
  dismissed: "Verworfen",
};

export default async function AdminFeedbackPage() {
  await requireAdminSession();

  let feedback: FeedbackEntry[] = [];
  let issues: IssueReport[] = [];
  let dbError: string | null = null;
  try {
    [feedback, issues] = await Promise.all([
      new SupabaseFeedbackRepository().listAll(),
      new SupabaseIssueReportRepository().listAll(),
    ]);
  } catch (error) {
    console.error("Admin feedback: failed to load feedback/issues from Supabase", error);
    dbError = describeUnknownError(error);
  }

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-brand-navy-900">Feedback &amp; Probleme</h1>
        <Link href="/admin" className="text-sm text-brand-teal-700 hover:underline">
          ← Zur Übersicht
        </Link>
      </div>

      {dbError && (
        <div
          role="alert"
          className="rounded-lg border border-brand-warning-500 bg-brand-warning-100 p-4 text-sm text-brand-warning-600"
        >
          Datenbank nicht verbunden ({dbError}). Diese Ansicht funktioniert, sobald Supabase
          eingerichtet ist (siehe docs/OPEN_RISKS.md).
        </div>
      )}

      <section>
        <h2 className="mb-3 font-semibold text-brand-navy-900">
          Gemeldete Probleme ({issues.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-brand-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-neutral-200 text-brand-neutral-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Erstellt</th>
                <th className="px-3 py-2 font-semibold">Kategorie</th>
                <th className="px-3 py-2 font-semibold">Beschreibung</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-b border-brand-neutral-100 align-top last:border-0">
                  <td className="px-3 py-2 text-brand-neutral-600">
                    {new Date(issue.createdAt).toLocaleString("de-CH")}
                  </td>
                  <td className="px-3 py-2 text-brand-neutral-600">{issue.category ?? "–"}</td>
                  <td className="px-3 py-2 text-brand-neutral-950">{issue.description}</td>
                  <td className="px-3 py-2 font-medium text-brand-navy-900">
                    {ISSUE_STATUS_LABEL[issue.status]}
                  </td>
                  <td className="px-3 py-2">
                    {issue.status === "open" && (
                      <div className="flex flex-wrap gap-3 text-xs">
                        <form action={resolveIssueAction}>
                          <input type="hidden" name="issueId" value={issue.id} />
                          <button type="submit" className="text-brand-teal-700 hover:underline">
                            Als gelöst markieren
                          </button>
                        </form>
                        <form action={dismissIssueAction}>
                          <input type="hidden" name="issueId" value={issue.id} />
                          <button type="submit" className="text-brand-warning-600 hover:underline">
                            Verwerfen
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {issues.length === 0 && !dbError && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-brand-neutral-600">
                    Keine gemeldeten Probleme.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-brand-navy-900">Feedback ({feedback.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-brand-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-neutral-200 text-brand-neutral-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Erstellt</th>
                <th className="px-3 py-2 font-semibold">Bewertung</th>
                <th className="px-3 py-2 font-semibold">Kommentar</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((entry) => (
                <tr key={entry.id} className="border-b border-brand-neutral-100 align-top last:border-0">
                  <td className="px-3 py-2 text-brand-neutral-600">
                    {new Date(entry.createdAt).toLocaleString("de-CH")}
                  </td>
                  <td className="px-3 py-2 font-medium text-brand-navy-900">
                    {entry.rating != null ? `${entry.rating} / 5` : "–"}
                  </td>
                  <td className="px-3 py-2 text-brand-neutral-950">{entry.comment ?? "–"}</td>
                </tr>
              ))}
              {feedback.length === 0 && !dbError && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-brand-neutral-600">
                    Noch kein Feedback.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

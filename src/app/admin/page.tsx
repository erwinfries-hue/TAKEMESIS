import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/require-admin-session";
import { describeUnknownError } from "@/lib/errors/describe-unknown-error";
import { SupabaseReportRepository } from "@/lib/reports/supabase-report-repository";
import type { Report } from "@/lib/reports/types";
import type { ReportStatus } from "@/lib/reports/lifecycle";
import { adminLogoutAction } from "./login/actions";
import {
  blockReportAction,
  markRefundPendingAction,
  recordRefundedAction,
  retryReportAction,
  revokeReportAction,
} from "./actions";

export const metadata: Metadata = { title: "Admin — TEKMESIS" };

const STATUS_ORDER: ReportStatus[] = [
  "draft",
  "preview_ready",
  "checkout_started",
  "paid",
  "processing",
  "ready",
  "failed",
  "refund_pending",
  "refunded",
  "blocked",
  "expired",
];

export default async function AdminOverviewPage() {
  const adminEmail = await requireAdminSession();

  let reports: Report[] = [];
  let dbError: string | null = null;
  try {
    reports = await new SupabaseReportRepository().listAll();
  } catch (error) {
    console.error("Admin overview: failed to load reports from Supabase", error);
    dbError = describeUnknownError(error);
  }

  const counts = new Map<ReportStatus, number>(STATUS_ORDER.map((status) => [status, 0]));
  for (const report of reports) {
    counts.set(report.status, (counts.get(report.status) ?? 0) + 1);
  }

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-brand-navy-900">Admin-Übersicht</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-brand-neutral-600">{adminEmail}</span>
          <Link href="/admin/payments" className="text-brand-teal-700 hover:underline">
            Zahlungen
          </Link>
          <Link href="/admin/feedback" className="text-brand-teal-700 hover:underline">
            Feedback &amp; Probleme
          </Link>
          <Link href="/admin/example-questions" className="text-brand-teal-700 hover:underline">
            Beispielfragen prüfen
          </Link>
          <Link href="/admin/report-preview" className="text-brand-teal-700 hover:underline">
            Report-Vorschau (KI)
          </Link>
          <form action={adminLogoutAction}>
            <button type="submit" className="text-brand-teal-700 hover:underline">
              Abmelden
            </button>
          </form>
        </div>
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
        <h2 className="mb-3 font-semibold text-brand-navy-900">Reports nach Status</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="rounded-lg border border-brand-neutral-200 bg-white p-3">
              <dt className="text-xs text-brand-neutral-600">{status}</dt>
              <dd className="text-xl font-semibold text-brand-navy-900">{counts.get(status)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-brand-navy-900">Reports ({reports.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-brand-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-neutral-200 text-brand-neutral-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Erstellt</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Eignung</th>
                <th className="px-3 py-2 font-semibold">Thema</th>
                <th className="px-3 py-2 font-semibold">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-brand-neutral-100 align-top last:border-0">
                  <td className="px-3 py-2 text-brand-neutral-600">
                    {new Date(report.createdAt).toLocaleString("de-CH")}
                  </td>
                  <td className="px-3 py-2 font-medium text-brand-navy-900">{report.status}</td>
                  <td className="px-3 py-2 text-brand-neutral-600">{report.eligibility ?? "–"}</td>
                  <td className="px-3 py-2 text-brand-neutral-600">{report.domainSlug ?? "–"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-3 text-xs">
                      {report.status === "failed" && (
                        <form action={retryReportAction}>
                          <input type="hidden" name="reportId" value={report.id} />
                          <button type="submit" className="text-brand-teal-700 hover:underline">
                            Erneut versuchen
                          </button>
                        </form>
                      )}
                      {(report.status === "paid" ||
                        report.status === "processing" ||
                        report.status === "ready") && (
                        <form action={blockReportAction}>
                          <input type="hidden" name="reportId" value={report.id} />
                          <button type="submit" className="text-brand-warning-600 hover:underline">
                            Blockieren
                          </button>
                        </form>
                      )}
                      {(report.status === "failed" ||
                        report.status === "blocked" ||
                        report.status === "ready") && (
                        <form action={markRefundPendingAction}>
                          <input type="hidden" name="reportId" value={report.id} />
                          <button type="submit" className="text-brand-warning-600 hover:underline">
                            Rückerstattung markieren
                          </button>
                        </form>
                      )}
                      {report.status === "refund_pending" && (
                        <form action={recordRefundedAction}>
                          <input type="hidden" name="reportId" value={report.id} />
                          <button type="submit" className="text-brand-teal-700 hover:underline">
                            Rückerstattung bestätigen
                          </button>
                        </form>
                      )}
                      {!report.revokedAt && (
                        <form action={revokeReportAction}>
                          <input type="hidden" name="reportId" value={report.id} />
                          <button type="submit" className="text-brand-warning-600 hover:underline">
                            Link sperren
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && !dbError && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-brand-neutral-600">
                    Noch keine Reports.
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

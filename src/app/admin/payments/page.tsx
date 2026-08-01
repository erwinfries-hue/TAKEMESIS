import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/require-admin-session";
import { describeUnknownError } from "@/lib/errors/describe-unknown-error";
import { SupabasePaymentRepository } from "@/lib/payments/supabase-payment-repository";
import type { Payment } from "@/lib/payments/types";
import { refundPaymentAction } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "Admin — Zahlungen — TEKMESIS",
  robots: { index: false, follow: false },
};

export default async function AdminPaymentsPage() {
  await requireAdminSession();

  let payments: Payment[] = [];
  let dbError: string | null = null;
  try {
    payments = await new SupabasePaymentRepository().listAll();
  } catch (error) {
    console.error("Admin payments: failed to load payments from Supabase", error);
    dbError = describeUnknownError(error);
  }

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-brand-navy-900">Zahlungen</h1>
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

      <div className="overflow-x-auto rounded-xl border border-brand-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-neutral-200 text-brand-neutral-600">
            <tr>
              <th className="px-3 py-2 font-semibold">Erstellt</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Betrag</th>
              <th className="px-3 py-2 font-semibold">Preisversion</th>
              <th className="px-3 py-2 font-semibold">Modus</th>
              <th className="px-3 py-2 font-semibold">Stripe Session</th>
              <th className="px-3 py-2 font-semibold">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-brand-neutral-100 last:border-0">
                <td className="px-3 py-2 text-brand-neutral-600">
                  {new Date(payment.createdAt).toLocaleString("de-CH")}
                </td>
                <td className="px-3 py-2 font-medium text-brand-navy-900">{payment.status}</td>
                <td className="px-3 py-2 text-brand-neutral-600">
                  {(payment.amountMinor / 100).toFixed(2)} {payment.currency}
                </td>
                <td className="px-3 py-2 text-brand-neutral-600">{payment.priceVersion}</td>
                <td className="px-3 py-2 text-brand-neutral-600">{payment.mode}</td>
                <td className="px-3 py-2 text-brand-neutral-600">
                  {payment.stripeCheckoutSessionId}
                </td>
                <td className="px-3 py-2">
                  {payment.status === "paid" && payment.stripePaymentIntentId && (
                    <form action={refundPaymentAction}>
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-brand-warning-500 px-3 py-1 text-xs font-medium text-brand-warning-600 transition-colors hover:bg-brand-warning-100"
                      >
                        Rückerstatten
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && !dbError && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-brand-neutral-600">
                  Noch keine Zahlungen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

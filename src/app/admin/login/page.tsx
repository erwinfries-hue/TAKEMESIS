import type { Metadata } from "next";
import { adminLoginAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin Login — TEKMESIS",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold text-brand-navy-900">Admin-Login</h1>
      <form
        action={adminLoginAction}
        className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-6"
      >
        {error && (
          <p role="alert" className="text-sm text-brand-warning-600">
            Ungültige E-Mail-Adresse oder ungültiger Zugangscode.
          </p>
        )}
        <label htmlFor="admin-email" className="text-sm font-medium text-brand-neutral-950">
          E-Mail
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-lg border border-brand-neutral-200 p-2 text-sm"
        />
        <label htmlFor="admin-secret" className="text-sm font-medium text-brand-neutral-950">
          Zugangscode
        </label>
        <input
          id="admin-secret"
          name="secret"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-lg border border-brand-neutral-200 p-2 text-sm"
        />
        <button
          type="submit"
          className="mt-2 rounded-full bg-brand-navy-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-navy-800"
        >
          Anmelden
        </button>
      </form>
    </main>
  );
}

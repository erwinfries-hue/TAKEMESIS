import "server-only";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { allAdapters } from "@/lib/source-adapters/registry";

/**
 * Async server component — the actual live pings happen here, on the
 * request that renders it, streamed in behind a Suspense boundary from
 * the page so the rest of `/sources` isn't held up waiting on 4 external
 * APIs (same "ok: false, don't fail the page" spirit as the /search
 * pipeline's per-source resilience).
 */
export async function SourceStatusPanel({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const statuses = await Promise.all(
    allAdapters.map(async (adapter) => ({
      name: adapter.capabilities.name,
      status: await adapter.checkStatus(),
    })),
  );

  const dateFormat = locale === "de" ? "de-CH" : "en-CH";

  return (
    <section className="w-full max-w-4xl">
      <h2 className="mb-1 text-xl font-semibold text-brand-navy-900">
        {dict.sourcesPage.liveStatusHeading}
      </h2>
      <p className="mb-4 text-sm text-brand-neutral-600">{dict.sourcesPage.liveStatusIntro}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {statuses.map(({ name, status }) => (
          <div
            key={status.source}
            className="flex items-start justify-between gap-3 rounded-xl border border-brand-neutral-200 bg-white p-4"
          >
            <div>
              <p className="font-medium text-brand-navy-900">{name}</p>
              <p className="text-xs text-brand-neutral-600">
                {dict.sourcesPage.liveStatusCheckedAtLabel}{" "}
                {new Date(status.checkedAt).toLocaleTimeString(dateFormat)}
              </p>
              {!status.ok && status.error && (
                <p className="mt-1 text-xs text-brand-warning-600">{status.error}</p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                status.ok
                  ? "bg-brand-teal-100 text-brand-teal-700"
                  : "bg-brand-warning-100 text-brand-warning-600"
              }`}
            >
              {status.ok ? dict.sourcesPage.liveStatusOk : dict.sourcesPage.liveStatusError}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

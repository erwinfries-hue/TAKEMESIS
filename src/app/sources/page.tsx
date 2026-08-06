import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { topics, topicCopy } from "@/content/topics";
import { SourceStatusPanel } from "@/components/source-status-panel";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    title: `${dict.sourcesPage.heading} — ${dict.brand.name}`,
    description: dict.sourcesPage.intro,
    alternates: { canonical: "/sources" },
  };
}

export default async function SourcesPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-6 py-16 sm:px-10">
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold text-brand-navy-900">
          {dict.sourcesPage.heading}
        </h1>
        <p className="text-brand-neutral-600">{dict.sourcesPage.intro}</p>
      </div>

      <section className="w-full max-w-4xl">
        <h2 className="mb-4 text-xl font-semibold text-brand-navy-900">
          {dict.sourcesPage.layersHeading}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {dict.sourcesPage.layers.map((layer) => (
            <div
              key={layer.title}
              className="rounded-xl border border-brand-neutral-200 bg-white p-5"
            >
              <h3 className="mb-1 font-semibold text-brand-navy-900">{layer.title}</h3>
              <p className="text-sm text-brand-neutral-600">{layer.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full max-w-4xl">
        <h2 className="mb-4 text-xl font-semibold text-brand-navy-900">
          {dict.sourcesPage.routingHeading}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-brand-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-neutral-200 text-brand-neutral-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{dict.topicsPage.heading}</th>
                <th className="px-4 py-3 font-semibold">{dict.topicsPage.sourceRouteHeading}</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.slug} className="border-b border-brand-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-brand-navy-900">
                    {topicCopy(topic, locale).name}
                  </td>
                  <td className="px-4 py-3 text-brand-neutral-600">{topic.sourceRoute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-2xl text-center">
        <h2 className="mb-2 text-xl font-semibold text-brand-navy-900">
          {dict.sourcesPage.honestyHeading}
        </h2>
        <p className="text-brand-neutral-600">{dict.sourcesPage.honestyBody}</p>
      </section>

      <Suspense
        fallback={
          <section className="w-full max-w-4xl">
            <h2 className="mb-1 text-xl font-semibold text-brand-navy-900">
              {dict.sourcesPage.liveStatusHeading}
            </h2>
            <p className="text-sm text-brand-neutral-600">{dict.sourcesPage.liveStatusLoading}</p>
          </section>
        }
      >
        <SourceStatusPanel dict={dict} locale={locale} />
      </Suspense>
    </main>
  );
}

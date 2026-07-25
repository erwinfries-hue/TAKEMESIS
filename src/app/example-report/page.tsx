import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.exampleReportPage.heading} — ${dict.brand.name}` };
}

export default async function ExampleReportPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 text-center sm:px-10">
      <h1 className="text-3xl font-semibold text-brand-navy-900">
        {dict.exampleReportPage.heading}
      </h1>
      <span className="rounded-full bg-brand-teal-100 px-3 py-1 text-xs font-medium text-brand-teal-700">
        {dict.exampleReportPage.status}
      </span>
      <p className="text-sm font-medium uppercase tracking-wide text-brand-neutral-600">
        {dict.exampleReportPage.topicLabel}
      </p>
      <p className="max-w-xl text-xl font-semibold text-brand-navy-900">
        {dict.exampleReportPage.topicQuestion}
      </p>
      <p className="max-w-xl text-brand-neutral-600">{dict.exampleReportPage.body}</p>
    </main>
  );
}

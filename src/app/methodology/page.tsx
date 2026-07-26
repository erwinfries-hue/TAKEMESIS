import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { MethodologyFunnelIllustration } from "@/components/methodology-funnel-illustration";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return { title: `${dict.methodologyPage.heading} — ${dict.brand.name}` };
}

export default async function MethodologyPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-6 py-16 sm:px-10">
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold text-brand-navy-900">
          {dict.methodologyPage.heading}
        </h1>
        <p className="text-brand-neutral-600">{dict.methodologyPage.intro}</p>
        <MethodologyFunnelIllustration className="h-24 w-auto sm:h-28" />
      </div>

      {/* flex-wrap + justify-center rather than a 2-column grid: 7 steps
          are an odd count, so a grid leaves the last item alone on the
          left with an empty gap beside it. This centers it instead. */}
      <ol className="flex w-full max-w-4xl flex-wrap justify-center gap-4">
        {dict.methodologyPage.steps.map((step, index) => (
          <li
            key={step.title}
            className="flex w-full flex-col gap-1 rounded-xl border border-brand-neutral-200 bg-white p-5 sm:w-[calc(50%-0.5rem)]"
          >
            <span className="text-xs font-semibold text-brand-teal-700">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-semibold text-brand-navy-900">{step.title}</span>
            <span className="text-sm text-brand-neutral-600">{step.body}</span>
          </li>
        ))}
      </ol>

      <p className="max-w-xl text-center text-sm text-brand-neutral-600">
        {dict.methodologyPage.disclaimer}
      </p>
    </main>
  );
}

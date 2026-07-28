import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { MethodologyFunnelIllustration } from "@/components/methodology-funnel-illustration";
import { MethodologyCalculator } from "@/components/methodology-calculator";
import { ProcessTimeline } from "@/components/process-timeline";

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

      <ProcessTimeline steps={dict.methodologyPage.steps} />

      <MethodologyCalculator dict={dict} />

      <p className="max-w-xl text-center text-sm text-brand-neutral-600">
        {dict.methodologyPage.disclaimer}
      </p>
    </main>
  );
}

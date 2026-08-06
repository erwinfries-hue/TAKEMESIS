import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

export function ExampleQuestionChip({ question, locale }: { question: string; locale: Locale }) {
  return (
    <Link
      href={`/${locale}/topics?q=${encodeURIComponent(question)}#eigene-frage`}
      className="inline-block rounded-full border border-brand-teal-400 bg-brand-teal-100 px-3 py-1 text-sm text-brand-navy-900 transition-colors hover:border-brand-teal-600 hover:bg-brand-teal-400/40"
    >
      {question}
    </Link>
  );
}

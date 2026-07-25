import Link from "next/link";

export function ExampleQuestionChip({ question }: { question: string }) {
  return (
    <Link
      href={`/topics?q=${encodeURIComponent(question)}#eigene-frage`}
      className="inline-block rounded-full border border-brand-teal-400 bg-brand-teal-100 px-3 py-1 text-sm text-brand-navy-900 transition-colors hover:border-brand-teal-600 hover:bg-brand-teal-400/40"
    >
      {question}
    </Link>
  );
}

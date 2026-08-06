import Link from "next/link";
import type { Topic, TopicCopy } from "@/content/topics";
import type { Locale } from "@/lib/i18n/config";
import { TopicIcon } from "@/components/icons/topic-icons";

export function TopicCard({
  topic,
  copy,
  elevatedRiskLabel,
  locale,
}: {
  topic: Topic;
  copy: TopicCopy;
  elevatedRiskLabel: string;
  locale: Locale;
}) {
  return (
    <Link
      href={`/${locale}/topics#${topic.slug}`}
      className="flex flex-col gap-2 rounded-xl border border-brand-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <TopicIcon slug={topic.slug} className="h-7 w-7 text-brand-teal-600" />
      <h3 className="font-semibold text-brand-navy-900">{copy.name}</h3>
      <p className="text-sm text-brand-neutral-600">{copy.description}</p>
      {topic.riskProfile === "elevated" && (
        <span className="mt-1 inline-block w-fit rounded-full bg-brand-warning-100 px-2 py-0.5 text-xs font-medium text-brand-warning-600">
          {elevatedRiskLabel}
        </span>
      )}
    </Link>
  );
}

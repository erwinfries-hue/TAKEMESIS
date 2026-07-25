import Link from "next/link";
import type { Topic, TopicCopy } from "@/content/topics";

export function TopicCard({
  topic,
  copy,
  elevatedRiskLabel,
}: {
  topic: Topic;
  copy: TopicCopy;
  elevatedRiskLabel: string;
}) {
  return (
    <Link
      href={`/topics#${topic.slug}`}
      className="flex flex-col gap-2 rounded-xl border border-brand-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
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

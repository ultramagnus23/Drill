import { TopicRecord } from "@/lib/types";

export default function TopicCard({
  topic,
  isRevisit,
}: {
  topic: TopicRecord;
  isRevisit: boolean;
}) {
  return (
    <div className="max-w-xl">
      {isRevisit && (
        <div className="text-xs uppercase tracking-widest text-accent mb-3">
          Revisit
        </div>
      )}
      <p className="font-serif text-3xl md:text-4xl leading-snug text-ink">
        {topic.topic}
      </p>
    </div>
  );
}

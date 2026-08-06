import { formatClock } from "@/lib/format";
import { TopicRecord } from "@/lib/types";

export default function ResearchPanel({
  topic,
  isRevisit,
  remainingMs,
  notesText,
  onNotesChange,
}: {
  topic: TopicRecord;
  isRevisit: boolean;
  remainingMs: number;
  notesText: string;
  onNotesChange: (value: string) => void;
}) {
  const isFinalMinute = remainingMs <= 60_000;

  return (
    <div className="flex flex-col gap-6 max-w-2xl w-full">
      <div>
        {isRevisit && (
          <div className="text-xs uppercase tracking-widest text-accent mb-2">
            Revisit
          </div>
        )}
        <p className="font-serif text-2xl leading-snug text-ink">{topic.topic}</p>
      </div>

      <div
        className={`font-sans text-2xl tabular-nums ${
          isFinalMinute ? "text-accent" : "text-ink-quiet"
        }`}
      >
        {formatClock(remainingMs)}
      </div>

      <textarea
        value={notesText}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Notes…"
        className="w-full min-h-[40vh] resize-none bg-card border border-rule rounded-md p-4 text-sm text-ink leading-relaxed focus:outline-none focus:border-accent-quiet"
        autoFocus
      />
    </div>
  );
}

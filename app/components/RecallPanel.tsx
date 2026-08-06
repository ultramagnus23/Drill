import { formatClock } from "@/lib/format";

export default function RecallPanel({
  remainingMs,
  isRecording,
  micError,
}: {
  remainingMs: number;
  isRecording: boolean;
  micError: string | null;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="font-sans text-6xl tabular-nums text-ink">
        {formatClock(remainingMs)}
      </div>
      <div className="flex items-center gap-2 text-sm text-ink-quiet">
        {isRecording && (
          <span className="inline-block w-2 h-2 rounded-full bg-accent" />
        )}
        <span>
          {micError ? "Recording unavailable — speak anyway" : isRecording ? "Recording" : "Starting…"}
        </span>
      </div>
    </div>
  );
}

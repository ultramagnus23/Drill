"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/app/components/Nav";
import { getSession, getAudio } from "@/lib/db";
import { loadTopics, topicById } from "@/lib/topics";
import { Session, TopicRecord } from "@/lib/types";

export default function ArchiveDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [topic, setTopic] = useState<TopicRecord | undefined>(undefined);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, audio, topics] = await Promise.all([getSession(id), getAudio(id), loadTopics()]);
      if (cancelled) return;
      setSession(s ?? null);
      if (s) setTopic(topicById(topics, s.topicId));
      if (audio) setAudioUrl(URL.createObjectURL(audio));
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className="flex-1 flex flex-col">
      <Nav />
      <div className="flex-1 px-6 py-8 max-w-2xl w-full mx-auto flex flex-col gap-6">
        <Link href="/archive" className="text-sm text-ink-quiet hover:text-ink w-fit">
          ← Archive
        </Link>

        {session === undefined && <p className="text-sm text-ink-quiet">Loading…</p>}
        {session === null && <p className="text-sm text-ink-quiet">Session not found.</p>}

        {session && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-ink-quiet">
                {session.date} · {session.domain}
                {session.isRevisit && " · revisit"}
                {session.wasRerolled && " · re-rolled"}
              </span>
              <p className="font-serif text-2xl text-ink leading-snug">
                {topic?.topic ?? "Unknown topic"}
              </p>
            </div>

            {audioUrl && (
              <audio controls src={audioUrl} className="w-full">
                Your browser does not support audio playback.
              </audio>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm">
              <ScoreStat label="Fluency" value={session.fluency} />
              <ScoreStat label="Depth" value={session.depth} />
              <ScoreStat label="Coverage" value={session.coverage} />
            </div>

            {session.failureNote && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-ink-quiet">What I failed to explain</span>
                <p className="text-sm text-ink leading-relaxed">{session.failureNote}</p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-xs text-ink-quiet">Notes</span>
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink leading-relaxed bg-card border border-rule rounded-md p-4">
                {session.notesText || "(no notes)"}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 py-3 border border-rule rounded-md bg-card">
      <span className="text-lg text-ink">{value}</span>
      <span className="text-xs text-ink-quiet">{label}</span>
    </div>
  );
}

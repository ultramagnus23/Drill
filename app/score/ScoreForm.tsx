"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ScoreInput from "@/app/components/ScoreInput";
import { getSession, getAudio, saveSession } from "@/lib/db";
import { recordStreakCompletion } from "@/lib/storage";
import { Session } from "@/lib/types";

export default function ScoreForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [session, setSession] = useState<Session | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fluency, setFluency] = useState(0);
  const [depth, setDepth] = useState(0);
  const [coverage, setCoverage] = useState(0);
  const [failureNote, setFailureNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      router.replace("/");
      return;
    }
    let cancelled = false;
    (async () => {
      const [s, audio] = await Promise.all([getSession(id), getAudio(id)]);
      if (cancelled) return;
      if (!s) {
        router.replace("/");
        return;
      }
      setSession(s);
      if (audio) setAudioUrl(URL.createObjectURL(audio));
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const canSave = fluency > 0 && depth > 0 && coverage > 0 && !saving;

  async function handleSave() {
    if (!session || !canSave) return;
    setSaving(true);
    const updated: Session = { ...session, fluency, depth, coverage, failureNote };
    await saveSession(updated, null);
    recordStreakCompletion(session.date);
    router.push("/");
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-ink-quiet">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col gap-8">
        {audioUrl && (
          <audio controls src={audioUrl} className="w-full">
            Your browser does not support audio playback.
          </audio>
        )}

        <ScoreInput label="Fluency — stumbles, filler words, dead air" value={fluency} onChange={setFluency} />
        <ScoreInput
          label="Depth — said anything past a Wikipedia intro"
          value={depth}
          onChange={setDepth}
        />
        <ScoreInput
          label="Coverage — spoke what you actually researched"
          value={coverage}
          onChange={setCoverage}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="failure" className="text-sm text-ink-quiet">
            What did you fail to explain?
          </label>
          <textarea
            id="failure"
            value={failureNote}
            onChange={(e) => setFailureNote(e.target.value)}
            className="w-full min-h-[8rem] resize-none bg-card border border-rule rounded-md p-3 text-sm text-ink leading-relaxed focus:outline-none focus:border-accent-quiet"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="self-start px-5 py-2 bg-ink text-paper text-sm rounded-md hover:opacity-90 disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}

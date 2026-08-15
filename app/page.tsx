"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/app/components/Nav";
import TopicCard from "@/app/components/TopicCard";
import ResearchPanel from "@/app/components/ResearchPanel";
import RecallPanel from "@/app/components/RecallPanel";
import { loadTopics, topicById } from "@/lib/topics";
import { startRecording, ActiveRecording } from "@/lib/recorder";
import { TodayState, TopicRecord } from "@/lib/types";

type Status = "loading" | "done" | "active";

export default function TodayPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [topics, setTopics] = useState<TopicRecord[]>([]);
  const [phaseData, setPhaseData] = useState<TodayState | null>(null);
  const [streak, setStreak] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [micError, setMicError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const recordingRef = useRef<ActiveRecording | null>(null);
  const finalizingRef = useRef(false);
  const phaseDataRef = useRef<TodayState | null>(null);
  const topicRef = useRef<TopicRecord | undefined>(undefined);

  // ---- initial load / resume, from the server ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loadedTopics, res] = await Promise.all([
        loadTopics(),
        fetch("/api/today").then((r) => r.json()),
      ]);
      if (cancelled) return;
      setTopics(loadedTopics);

      if (res.status === "done") {
        setStreak(res.streak);
        setStatus("done");
        return;
      }

      setPhaseData(res.draw);
      setStatus("active");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const topic = phaseData ? topicById(topics, phaseData.topicId) : undefined;

  useEffect(() => {
    phaseDataRef.current = phaseData;
  }, [phaseData]);

  useEffect(() => {
    topicRef.current = topic;
  }, [topic]);

  async function handleStart() {
    const res = await fetch("/api/today/start", { method: "POST" });
    if (res.ok) setPhaseData((await res.json()).draw);
  }

  async function handleReroll() {
    const res = await fetch("/api/today/reroll", { method: "POST" });
    if (res.ok) setPhaseData((await res.json()).draw);
  }

  function handleNotesChange(value: string) {
    setPhaseData((prev) => (prev ? { ...prev, notesText: value } : prev));
    fetch("/api/today/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notesText: value }),
    });
  }

  // ---- research countdown + hard lock into recall ----
  useEffect(() => {
    if (!phaseData || phaseData.phase !== "research") return;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const current = phaseDataRef.current;
      if (
        current &&
        current.phase === "research" &&
        current.researchEndsAt &&
        n >= current.researchEndsAt
      ) {
        fetch("/api/today/lock", { method: "POST" })
          .then((r) => r.json())
          .then((data) => data.draw && setPhaseData(data.draw));
      }
    }, 200);
    return () => clearInterval(id);
  }, [phaseData?.phase]);

  // ---- start recording on entering recall ----
  useEffect(() => {
    if (!phaseData || phaseData.phase !== "recall") return;
    if (recordingRef.current || finalizingRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const rec = await startRecording();
        if (cancelled) {
          rec.stop();
          return;
        }
        recordingRef.current = rec;
        setIsRecording(true);
      } catch {
        if (!cancelled) setMicError("denied");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phaseData?.phase]);

  // ---- recall countdown + finalize -> upload -> score screen ----
  async function finalizeRecall(state: TodayState) {
    let audioBlob: Blob | null = null;
    if (recordingRef.current) {
      audioBlob = await recordingRef.current.stop();
      recordingRef.current = null;
    }
    setIsRecording(false);

    const form = new FormData();
    const startedAt = (state.recallEndsAt ?? Date.now()) - 60_000;
    form.set("durationSpoken", String(Math.max(0, Math.round((Date.now() - startedAt) / 1000))));
    if (audioBlob) form.set("audio", audioBlob, "recall.webm");

    const res = await fetch("/api/today/finalize", { method: "POST", body: form });
    const data = await res.json();
    router.push(`/score?id=${data.sessionId}`);
  }

  useEffect(() => {
    if (!phaseData || phaseData.phase !== "recall") return;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const current = phaseDataRef.current;
      if (
        current &&
        current.phase === "recall" &&
        current.recallEndsAt &&
        n >= current.recallEndsAt &&
        !finalizingRef.current
      ) {
        finalizingRef.current = true;
        finalizeRecall(current);
      }
    }, 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseData?.phase]);

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-ink-quiet">
        Loading…
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex-1 flex flex-col">
        <Nav />
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="font-serif text-2xl text-ink">Done for today.</p>
          <p className="text-sm text-ink-quiet">Streak: {streak}</p>
        </div>
      </div>
    );
  }

  if (!phaseData || !topic) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-ink-quiet">
        Loading…
      </div>
    );
  }

  if (phaseData.phase === "draw") {
    return (
      <div className="flex-1 flex flex-col">
        <Nav />
        <div className="flex-1 flex flex-col items-center justify-center gap-10 px-6">
          <TopicCard topic={topic} isRevisit={phaseData.isRevisit} />
          <div className="flex items-center gap-6">
            <button
              onClick={handleStart}
              className="px-5 py-2 bg-ink text-paper text-sm rounded-md hover:opacity-90"
            >
              Start
            </button>
            {!phaseData.rerollUsed && (
              <button
                onClick={handleReroll}
                className="text-sm text-ink-quiet hover:text-ink underline underline-offset-4"
              >
                Re-roll (1 left today)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phaseData.phase === "research") {
    const remainingMs = Math.max(0, (phaseData.researchEndsAt ?? now) - now);
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          <ResearchPanel
            topic={topic}
            isRevisit={phaseData.isRevisit}
            remainingMs={remainingMs}
            notesText={phaseData.notesText}
            onNotesChange={handleNotesChange}
          />
        </div>
      </div>
    );
  }

  // recall
  const remainingMs = Math.max(0, (phaseData.recallEndsAt ?? now) - now);
  return (
    <div className="flex-1 flex items-center justify-center">
      <RecallPanel remainingMs={remainingMs} isRecording={isRecording} micError={micError} />
    </div>
  );
}

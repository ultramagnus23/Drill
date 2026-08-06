"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/app/components/Nav";
import TopicCard from "@/app/components/TopicCard";
import ResearchPanel from "@/app/components/ResearchPanel";
import RecallPanel from "@/app/components/RecallPanel";
import { loadTopics, topicById } from "@/lib/topics";
import { selectTopic } from "@/lib/selection";
import { getAllSessions, saveSession } from "@/lib/db";
import { sessionsToHistory, newSessionId, isPending } from "@/lib/session";
import {
  todayISO,
  getStreak,
  getRerollUsed,
  markRerollUsed,
  getTodayState,
  setTodayState,
  clearTodayState,
} from "@/lib/storage";
import { RESEARCH_SECONDS, RECALL_SECONDS } from "@/lib/constants";
import { TodayState, TopicRecord, Session } from "@/lib/types";
import { startRecording, ActiveRecording } from "@/lib/recorder";

type Status = "loading" | "done" | "active";

export default function TodayPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [topics, setTopics] = useState<TopicRecord[]>([]);
  const [phaseData, setPhaseData] = useState<TodayState | null>(null);
  const [streak, setStreak] = useState(0);
  const [rerollAvailable, setRerollAvailable] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [micError, setMicError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const recordingRef = useRef<ActiveRecording | null>(null);
  const finalizingRef = useRef(false);
  const phaseDataRef = useRef<TodayState | null>(null);
  const topicRef = useRef<TopicRecord | undefined>(undefined);

  // ---- initial load / resume ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loadedTopics, sessions] = await Promise.all([loadTopics(), getAllSessions()]);
      if (cancelled) return;

      const today = todayISO();
      const completedToday = sessions.find((s) => s.date === today && !isPending(s));
      if (completedToday) {
        setStreak(getStreak().count);
        setStatus("done");
        return;
      }

      setTopics(loadedTopics);
      setRerollAvailable(!getRerollUsed(today));

      let state = getTodayState();
      if (!state || state.date !== today) {
        const history = sessionsToHistory(sessions);
        const { topic, isRevisit } = selectTopic(loadedTopics, history, today);
        state = {
          date: today,
          topicId: topic.id,
          isRevisit,
          wasRerolled: false,
          phase: "draw",
          notesText: "",
          researchEndsAt: null,
          recallEndsAt: null,
        };
        setTodayState(state);
      } else if (
        state.phase === "research" &&
        state.researchEndsAt &&
        Date.now() >= state.researchEndsAt
      ) {
        // Resumed after the research window already closed elsewhere — the
        // lock must hold, so jump straight into a fresh recall window.
        state = { ...state, phase: "recall", recallEndsAt: Date.now() + RECALL_SECONDS * 1000 };
        setTodayState(state);
      }

      setPhaseData(state);
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

  function persist(update: Partial<TodayState>) {
    setPhaseData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...update };
      setTodayState(next);
      return next;
    });
  }

  function handleStart() {
    persist({ phase: "research", researchEndsAt: Date.now() + RESEARCH_SECONDS * 1000 });
  }

  async function handleReroll() {
    if (!phaseData) return;
    const today = todayISO();
    const sessions = await getAllSessions();
    const history = sessionsToHistory(sessions);
    const { topic: newTopic, isRevisit } = selectTopic(topics, history, today, {
      excludeIds: new Set([phaseData.topicId]),
    });
    markRerollUsed(today);
    setRerollAvailable(false);
    persist({ topicId: newTopic.id, isRevisit, wasRerolled: true });
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
        persist({ phase: "recall", recallEndsAt: Date.now() + RECALL_SECONDS * 1000 });
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

  // ---- recall countdown + finalize -> save pending session -> score screen ----
  async function finalizeRecall(state: TodayState) {
    let audioBlob: Blob | null = null;
    if (recordingRef.current) {
      audioBlob = await recordingRef.current.stop();
      recordingRef.current = null;
    }
    setIsRecording(false);

    const id = newSessionId();
    const session: Session = {
      id,
      date: state.date,
      topicId: state.topicId,
      domain: topicRef.current?.domain ?? "",
      notesText: state.notesText,
      hasAudio: !!audioBlob,
      fluency: 0,
      depth: 0,
      coverage: 0,
      failureNote: "",
      wasRerolled: state.wasRerolled,
      isRevisit: state.isRevisit,
      durationSpoken: RECALL_SECONDS,
    };
    await saveSession(session, audioBlob);
    clearTodayState();
    router.push(`/score?id=${id}`);
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
            {rerollAvailable && (
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
            onNotesChange={(value) => persist({ notesText: value })}
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

import { Session } from "./types";
import { HistoryEntry } from "./selection";

// A session is "pending" (recall just finished, not yet self-scored) when
// fluency is 0 — the 1-5 scale never legitimately produces that value.
export function isPending(session: Session): boolean {
  return session.fluency === 0;
}

export function sessionsToHistory(sessions: Session[]): HistoryEntry[] {
  return sessions
    .filter((s) => !isPending(s))
    .map((s) => ({
      topicId: s.topicId,
      domain: s.domain,
      date: s.date,
      depth: s.depth,
    }));
}

export function newSessionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

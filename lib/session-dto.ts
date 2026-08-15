import { DrillSession } from "@/lib/generated/prisma/client";

export function serializeSession(s: DrillSession) {
  return {
    id: s.id,
    date: s.date,
    topicId: s.topicId,
    domain: s.domain,
    notesText: s.notesText,
    hasAudio: s.audioData !== null,
    fluency: s.fluency,
    depth: s.depth,
    coverage: s.coverage,
    failureNote: s.failureNote,
    wasRerolled: s.wasRerolled,
    isRevisit: s.isRevisit,
    durationSpoken: s.durationSpoken,
    createdAt: s.createdAt.toISOString(),
  };
}

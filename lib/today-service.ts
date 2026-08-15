import { prisma } from "./prisma";
import { loadTopicsServer } from "./topics-server";
import { selectTopic, HistoryEntry } from "./selection";
import { todayISO } from "./storage";
import { RECALL_SECONDS, RESEARCH_SECONDS } from "./constants";

export { todayISO };

export async function buildHistory(userId: string): Promise<HistoryEntry[]> {
  const sessions = await prisma.drillSession.findMany({
    where: { userId, fluency: { gt: 0 } },
    select: { topicId: true, domain: true, date: true, depth: true },
  });
  return sessions.map((s) => ({ topicId: s.topicId, domain: s.domain, date: s.date, depth: s.depth }));
}

export async function getOrCreateDailyDraw(userId: string, date: string) {
  const existing = await prisma.dailyDraw.findUnique({ where: { userId_date: { userId, date } } });
  if (existing) return existing;

  const [topics, history] = await Promise.all([loadTopicsServer(), buildHistory(userId)]);
  const { topic, isRevisit } = selectTopic(topics, history, date);

  return prisma.dailyDraw.create({
    data: { userId, date, topicId: topic.id, isRevisit, phase: "draw" },
  });
}

export function serializeDraw(draw: {
  date: string;
  topicId: string;
  isRevisit: boolean;
  wasRerolled: boolean;
  rerollUsed: boolean;
  phase: string;
  notesText: string;
  researchEndsAt: Date | null;
  recallEndsAt: Date | null;
}) {
  return {
    date: draw.date,
    topicId: draw.topicId,
    isRevisit: draw.isRevisit,
    wasRerolled: draw.wasRerolled,
    rerollUsed: draw.rerollUsed,
    phase: draw.phase,
    notesText: draw.notesText,
    researchEndsAt: draw.researchEndsAt ? draw.researchEndsAt.getTime() : null,
    recallEndsAt: draw.recallEndsAt ? draw.recallEndsAt.getTime() : null,
  };
}

export const RESEARCH_MS = RESEARCH_SECONDS * 1000;
export const RECALL_MS = RECALL_SECONDS * 1000;

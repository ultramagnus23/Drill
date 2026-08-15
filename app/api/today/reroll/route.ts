import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadTopicsServer } from "@/lib/topics-server";
import { selectTopic } from "@/lib/selection";
import { buildHistory, serializeDraw, todayISO } from "@/lib/today-service";

export async function POST() {
  try {
    const user = await requireUser();
    const date = todayISO();
    const draw = await prisma.dailyDraw.findUnique({ where: { userId_date: { userId: user.id, date } } });
    if (!draw) return NextResponse.json({ error: "No draw for today." }, { status: 409 });
    if (draw.rerollUsed) return NextResponse.json({ error: "Re-roll already used today." }, { status: 409 });

    const [topics, history] = await Promise.all([loadTopicsServer(), buildHistory(user.id)]);
    const { topic, isRevisit } = selectTopic(topics, history, date, {
      excludeIds: new Set([draw.topicId]),
    });

    const updated = await prisma.dailyDraw.update({
      where: { userId_date: { userId: user.id, date } },
      data: { topicId: topic.id, isRevisit, wasRerolled: true, rerollUsed: true },
    });
    return NextResponse.json({ draw: serializeDraw(updated) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }
}

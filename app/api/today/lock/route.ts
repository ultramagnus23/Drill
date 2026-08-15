import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RECALL_MS, serializeDraw, todayISO } from "@/lib/today-service";

// Transitions research -> recall. Called by the client when the research
// timer expires, but the transition (and the notes lock it implies) is only
// real once the server commits it.
export async function POST() {
  try {
    const user = await requireUser();
    const date = todayISO();
    const draw = await prisma.dailyDraw.findUnique({ where: { userId_date: { userId: user.id, date } } });
    if (!draw) return NextResponse.json({ error: "No draw for today." }, { status: 409 });

    if (draw.phase === "recall") {
      return NextResponse.json({ draw: serializeDraw(draw) });
    }
    if (draw.phase !== "research") {
      return NextResponse.json({ error: "Not in research phase." }, { status: 409 });
    }

    const updated = await prisma.dailyDraw.update({
      where: { userId_date: { userId: user.id, date } },
      data: { phase: "recall", recallEndsAt: new Date(Date.now() + RECALL_MS) },
    });
    return NextResponse.json({ draw: serializeDraw(updated) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }
}

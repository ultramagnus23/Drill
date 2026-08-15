import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RESEARCH_MS, serializeDraw, todayISO } from "@/lib/today-service";

export async function POST() {
  try {
    const user = await requireUser();
    const date = todayISO();
    const draw = await prisma.dailyDraw.findUnique({ where: { userId_date: { userId: user.id, date } } });
    if (!draw || draw.phase !== "draw") {
      return NextResponse.json({ error: "Not in draw phase." }, { status: 409 });
    }

    const updated = await prisma.dailyDraw.update({
      where: { userId_date: { userId: user.id, date } },
      data: { phase: "research", researchEndsAt: new Date(Date.now() + RESEARCH_MS) },
    });
    return NextResponse.json({ draw: serializeDraw(updated) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }
}

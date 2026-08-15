import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeStreak } from "@/lib/streak";
import { getOrCreateDailyDraw, serializeDraw, todayISO } from "@/lib/today-service";

export async function GET() {
  try {
    const user = await requireUser();
    const date = todayISO();

    const completedToday = await prisma.drillSession.findFirst({
      where: { userId: user.id, date, fluency: { gt: 0 } },
    });

    if (completedToday) {
      const dates = await prisma.drillSession.findMany({
        where: { userId: user.id, fluency: { gt: 0 } },
        select: { date: true },
        distinct: ["date"],
      });
      const streak = computeStreak(
        dates.map((d) => d.date).sort(),
        date
      );
      return NextResponse.json({ status: "done", streak });
    }

    const draw = await getOrCreateDailyDraw(user.id, date);
    return NextResponse.json({ status: "active", draw: serializeDraw(draw) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayISO } from "@/lib/today-service";

// This is the server-side half of the hard lock: notes can only be written
// while phase is still "research", regardless of what the client claims.
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const date = todayISO();
    const body = await req.json().catch(() => null);
    const notesText = typeof body?.notesText === "string" ? body.notesText : null;
    if (notesText === null) return NextResponse.json({ error: "notesText required" }, { status: 400 });

    const draw = await prisma.dailyDraw.findUnique({ where: { userId_date: { userId: user.id, date } } });
    if (!draw || draw.phase !== "research") {
      return NextResponse.json({ error: "Notes are locked." }, { status: 409 });
    }

    await prisma.dailyDraw.update({
      where: { userId_date: { userId: user.id, date } },
      data: { notesText },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeSession } from "@/lib/session-dto";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const domain = req.nextUrl.searchParams.get("domain");

    const sessions = await prisma.drillSession.findMany({
      where: {
        userId: user.id,
        fluency: { gt: 0 },
        ...(domain ? { domain } : {}),
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ sessions: sessions.map(serializeSession) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }
}

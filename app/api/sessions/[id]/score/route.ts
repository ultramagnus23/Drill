import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeSession } from "@/lib/session-dto";

function isValidScore(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const session = await prisma.drillSession.findUnique({ where: { id } });
    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const { fluency, depth, coverage } = body ?? {};
    const failureNote = typeof body?.failureNote === "string" ? body.failureNote : "";

    if (!isValidScore(fluency) || !isValidScore(depth) || !isValidScore(coverage)) {
      return NextResponse.json({ error: "Scores must be integers 1-5." }, { status: 400 });
    }

    const updated = await prisma.drillSession.update({
      where: { id },
      data: { fluency, depth, coverage, failureNote },
    });

    return NextResponse.json({ session: serializeSession(updated) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }
}

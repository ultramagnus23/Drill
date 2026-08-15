import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const session = await prisma.drillSession.findUnique({
      where: { id },
      select: { userId: true, audioData: true, audioMimeType: true },
    });
    if (!session || session.userId !== user.id || !session.audioData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(session.audioData), {
      headers: { "Content-Type": session.audioMimeType || "audio/webm" },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }
}

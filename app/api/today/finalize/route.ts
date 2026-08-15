import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadTopicsServer, topicByIdServer } from "@/lib/topics-server";
import { todayISO } from "@/lib/today-service";
import { RECALL_SECONDS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const date = todayISO();
    const draw = await prisma.dailyDraw.findUnique({ where: { userId_date: { userId: user.id, date } } });
    if (!draw || draw.phase !== "recall") {
      return NextResponse.json({ error: "Not in recall phase." }, { status: 409 });
    }

    const form = await req.formData();
    const audioFile = form.get("audio");
    const durationRaw = form.get("durationSpoken");
    const durationSpoken =
      typeof durationRaw === "string" && !Number.isNaN(Number(durationRaw))
        ? Math.round(Number(durationRaw))
        : RECALL_SECONDS;

    let audioData: Uint8Array<ArrayBuffer> | null = null;
    let audioMimeType: string | null = null;
    if (audioFile instanceof File && audioFile.size > 0) {
      audioData = Uint8Array.from(new Uint8Array(await audioFile.arrayBuffer()));
      audioMimeType = audioFile.type || "audio/webm";
    }

    const topics = await loadTopicsServer();
    const topic = topicByIdServer(topics, draw.topicId);

    const session = await prisma.drillSession.create({
      data: {
        userId: user.id,
        date: draw.date,
        topicId: draw.topicId,
        domain: topic?.domain ?? "",
        notesText: draw.notesText,
        audioData: audioData ?? undefined,
        audioMimeType: audioMimeType ?? undefined,
        wasRerolled: draw.wasRerolled,
        isRevisit: draw.isRevisit,
        durationSpoken,
      },
    });

    await prisma.dailyDraw.delete({ where: { userId_date: { userId: user.id, date } } });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }
}

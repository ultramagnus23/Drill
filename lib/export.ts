import JSZip from "jszip";
import { Session } from "./types";

export async function exportAllData(): Promise<void> {
  const { sessions } = (await fetch("/api/sessions").then((r) => r.json())) as {
    sessions: Session[];
  };
  const zip = new JSZip();

  zip.file("sessions.json", JSON.stringify(sessions, null, 2));

  const audioFolder = zip.folder("audio");
  for (const s of sessions) {
    if (!s.hasAudio) continue;
    const blob = await fetch(`/api/sessions/${s.id}/audio`).then((r) => r.blob());
    audioFolder?.file(`${s.id}.webm`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `drill-export-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

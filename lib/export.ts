import JSZip from "jszip";
import { getAllSessions, getAudio } from "./db";
import { isPending } from "./session";

export async function exportAllData(): Promise<void> {
  const sessions = (await getAllSessions()).filter((s) => !isPending(s));
  const zip = new JSZip();

  zip.file("sessions.json", JSON.stringify(sessions, null, 2));

  const audioFolder = zip.folder("audio");
  for (const s of sessions) {
    if (!s.hasAudio) continue;
    const blob = await getAudio(s.id);
    if (blob) audioFolder?.file(`${s.id}.webm`, blob);
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

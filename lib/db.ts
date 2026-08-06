import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Session } from "./types";

interface DrillDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: { "by-date": string };
  };
  audio: {
    key: string; // session id
    value: Blob;
  };
}

let dbPromise: Promise<IDBPDatabase<DrillDB>> | null = null;

function getDb(): Promise<IDBPDatabase<DrillDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DrillDB>("drill", 1, {
      upgrade(db) {
        const sessions = db.createObjectStore("sessions", { keyPath: "id" });
        sessions.createIndex("by-date", "date");
        db.createObjectStore("audio");
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: Session, audio: Blob | null): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["sessions", "audio"], "readwrite");
  await tx.objectStore("sessions").put(session);
  if (audio) {
    await tx.objectStore("audio").put(audio, session.id);
  }
  await tx.done;
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDb();
  const all = await db.getAll("sessions");
  return all.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDb();
  return db.get("sessions", id);
}

export async function getAudio(id: string): Promise<Blob | undefined> {
  const db = await getDb();
  return db.get("audio", id);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["sessions", "audio"], "readwrite");
  await tx.objectStore("sessions").delete(id);
  await tx.objectStore("audio").delete(id);
  await tx.done;
}

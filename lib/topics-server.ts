import { readFile } from "fs/promises";
import { resolve } from "path";
import { TopicRecord } from "./types";

let cache: TopicRecord[] | null = null;

export async function loadTopicsServer(): Promise<TopicRecord[]> {
  if (cache) return cache;
  const filePath = resolve(process.cwd(), "public/topics.json");
  const raw = await readFile(filePath, "utf8");
  cache = JSON.parse(raw) as TopicRecord[];
  return cache;
}

export function topicByIdServer(topics: TopicRecord[], id: string): TopicRecord | undefined {
  return topics.find((t) => t.id === id);
}

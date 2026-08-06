import { TopicRecord } from "./types";

let cache: TopicRecord[] | null = null;

export async function loadTopics(): Promise<TopicRecord[]> {
  if (cache) return cache;
  const res = await fetch("/topics.json");
  if (!res.ok) throw new Error("Failed to load topic bank");
  cache = (await res.json()) as TopicRecord[];
  return cache;
}

export function topicById(topics: TopicRecord[], id: string): TopicRecord | undefined {
  return topics.find((t) => t.id === id);
}

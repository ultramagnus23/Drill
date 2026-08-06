export interface TopicRecord {
  id: string;
  topic: string;
  domain: string;
  difficulty: 1 | 2 | 3;
  tags: string[];
}

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  topicId: string;
  domain: string;
  notesText: string;
  hasAudio: boolean;
  fluency: number;
  depth: number;
  coverage: number;
  failureNote: string;
  wasRerolled: boolean;
  isRevisit: boolean;
  durationSpoken: number; // seconds actually recorded
}

export interface RerollState {
  date: string;
  used: boolean;
}

export interface TodayState {
  date: string;
  topicId: string;
  isRevisit: boolean;
  wasRerolled: boolean;
  phase: "draw" | "research" | "recall" | "done";
  notesText: string;
  researchEndsAt: number | null; // epoch ms
  recallEndsAt: number | null; // epoch ms
}

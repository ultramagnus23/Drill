import { TopicRecord } from "./types";
import {
  NO_REPEAT_DAYS,
  REVISIT_DAYS,
  ROTATION_WINDOW_DAYS,
  ROTATION_MAX_IN_WINDOW,
  DEPTH_REVISIT_THRESHOLD,
  DIFFICULTY_WEIGHTS,
} from "./constants";

export interface HistoryEntry {
  topicId: string;
  domain: string;
  date: string; // YYYY-MM-DD, date the topic was drawn/attempted
  depth?: number; // depth score, if a session was completed
}

export interface SelectionResult {
  topic: TopicRecord;
  isRevisit: boolean;
}

function daysBetween(earlier: string, later: string): number {
  const a = new Date(earlier + "T00:00:00Z").getTime();
  const b = new Date(later + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

function mostRecentByTopic(history: HistoryEntry[]): Map<string, HistoryEntry> {
  const map = new Map<string, HistoryEntry>();
  for (const entry of history) {
    const existing = map.get(entry.topicId);
    if (!existing || entry.date > existing.date) {
      map.set(entry.topicId, entry);
    }
  }
  return map;
}

function pickWeightedDifficulty(rng: () => number): 1 | 2 | 3 {
  const r = rng();
  let cumulative = 0;
  for (const key of [1, 2, 3] as const) {
    cumulative += DIFFICULTY_WEIGHTS[key];
    if (r < cumulative) return key;
  }
  return 2;
}

function pickRandom<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

/**
 * Selects the next topic given the full bank and a history of past draws.
 * Pure and deterministic given an injected rng, so it's unit-testable.
 */
export function selectTopic(
  topics: TopicRecord[],
  history: HistoryEntry[],
  today: string,
  options: { excludeIds?: Set<string>; rng?: () => number } = {}
): SelectionResult {
  const excludeIds = options.excludeIds ?? new Set<string>();
  const rng = options.rng ?? Math.random;

  const lastShown = mostRecentByTopic(history);
  const revisitIds = new Set(
    [...lastShown.entries()]
      .filter(([, e]) => e.depth !== undefined && e.depth <= DEPTH_REVISIT_THRESHOLD)
      .map(([id]) => id)
  );

  const isEligibleByRecency = (t: TopicRecord): boolean => {
    if (excludeIds.has(t.id)) return false;
    const last = lastShown.get(t.id);
    if (!last) return true;
    const requiredGap = revisitIds.has(t.id) ? REVISIT_DAYS : NO_REPEAT_DAYS;
    return daysBetween(last.date, today) >= requiredGap;
  };

  let candidates = topics.filter(isEligibleByRecency);

  // Bank exhausted fallback: no topic is outside its recency window. Reopen the
  // whole bank rather than deadlocking, honoring only the same-day exclusion.
  if (candidates.length === 0) {
    candidates = topics.filter((t) => !excludeIds.has(t.id));
  }

  // Domain rotation: never repeat yesterday's domain, never draw a third time
  // from the same domain within the last 7 days.
  const sortedHistory = [...history].sort((a, b) => (a.date < b.date ? 1 : -1));
  const lastDomain = sortedHistory[0]?.domain;

  const rollingCounts = new Map<string, number>();
  for (const entry of history) {
    if (daysBetween(entry.date, today) < ROTATION_WINDOW_DAYS) {
      rollingCounts.set(entry.domain, (rollingCounts.get(entry.domain) ?? 0) + 1);
    }
  }

  const applyDomainRotation = (pool: TopicRecord[]): TopicRecord[] =>
    pool.filter(
      (t) =>
        t.domain !== lastDomain &&
        (rollingCounts.get(t.domain) ?? 0) < ROTATION_MAX_IN_WINDOW
    );

  let rotated = applyDomainRotation(candidates);
  if (rotated.length === 0) {
    // Relax the rolling-window cap first, keep the no-repeat-yesterday rule.
    rotated = candidates.filter((t) => t.domain !== lastDomain);
  }
  if (rotated.length === 0) {
    // Last resort: drop domain constraints entirely rather than returning nothing.
    rotated = candidates;
  }
  candidates = rotated;

  // Difficulty weighting toward 2, ~20% each for 1 and 3.
  const chosenDifficulty = pickWeightedDifficulty(rng);
  const difficultyOrder: (1 | 2 | 3)[] =
    chosenDifficulty === 1
      ? [1, 2, 3]
      : chosenDifficulty === 3
        ? [3, 2, 1]
        : [2, 1, 3];

  let pool: TopicRecord[] = [];
  for (const diff of difficultyOrder) {
    pool = candidates.filter((t) => t.difficulty === diff);
    if (pool.length > 0) break;
  }
  if (pool.length === 0) pool = candidates;

  const topic = pickRandom(pool, rng);
  return { topic, isRevisit: revisitIds.has(topic.id) };
}

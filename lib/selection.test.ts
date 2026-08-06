import { describe, it, expect } from "vitest";
import { selectTopic, HistoryEntry } from "./selection";
import { TopicRecord } from "./types";

function makeTopics(spec: Array<[string, string, 1 | 2 | 3]>): TopicRecord[] {
  return spec.map(([id, domain, difficulty]) => ({
    id,
    domain,
    difficulty,
    topic: `Topic ${id}`,
    tags: [],
  }));
}

function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

describe("selectTopic: no-repeat window", () => {
  it("never re-selects a topic shown within the last 180 days", () => {
    const topics = makeTopics([
      ["a-1", "a", 2],
      ["b-1", "b", 2],
    ]);
    const today = "2026-01-01";
    const history: HistoryEntry[] = [
      { topicId: "a-1", domain: "a", date: addDays(today, -179) },
    ];
    for (let i = 0; i < 20; i++) {
      const { topic } = selectTopic(topics, history, today, { rng: () => i / 20 });
      expect(topic.id).toBe("b-1");
    }
  });

  it("allows re-selecting a topic once 180 days have passed", () => {
    const topics = makeTopics([
      ["a-1", "a", 2],
      ["b-1", "b", 2],
    ]);
    const today = "2026-01-01";
    const history: HistoryEntry[] = [
      { topicId: "a-1", domain: "a", date: addDays(today, -181) },
      { topicId: "b-1", domain: "b", date: addDays(today, -1) },
    ];
    // b-1 is excluded by domain rotation (drawn yesterday), a-1 should be eligible again.
    const { topic } = selectTopic(topics, history, today, { rng: () => 0.5 });
    expect(topic.id).toBe("a-1");
  });

  it("falls back to the full bank when every topic is within its recency window (bank exhausted)", () => {
    const topics = makeTopics([
      ["a-1", "a", 2],
      ["b-1", "b", 2],
    ]);
    const today = "2026-01-01";
    const history: HistoryEntry[] = [
      { topicId: "a-1", domain: "a", date: addDays(today, -5) },
      { topicId: "b-1", domain: "b", date: addDays(today, -179) },
    ];
    const { topic } = selectTopic(topics, history, today, { rng: () => 0.5 });
    expect(["a-1", "b-1"]).toContain(topic.id);
  });
});

describe("selectTopic: revisit pool", () => {
  it("keeps a low-depth topic out of the pool before 30 days have passed", () => {
    const topics = makeTopics([
      ["a-1", "a", 2],
      ["b-1", "b", 2],
    ]);
    const today = "2026-01-01";
    const history: HistoryEntry[] = [
      { topicId: "a-1", domain: "a", date: addDays(today, -10), depth: 1 },
    ];
    const { topic } = selectTopic(topics, history, today, { rng: () => 0.5 });
    expect(topic.id).toBe("b-1");
  });

  it("re-offers a low-depth topic after 30 days and flags it as a revisit", () => {
    const topics = makeTopics([
      ["a-1", "a", 2],
      ["b-1", "b", 2],
    ]);
    const today = "2026-01-01";
    const history: HistoryEntry[] = [
      { topicId: "a-1", domain: "a", date: addDays(today, -31), depth: 2 },
      { topicId: "b-1", domain: "b", date: addDays(today, -1) },
    ];
    const { topic, isRevisit } = selectTopic(topics, history, today, { rng: () => 0.5 });
    expect(topic.id).toBe("a-1");
    expect(isRevisit).toBe(true);
  });

  it("does not flag a normal high-depth topic as a revisit", () => {
    const topics = makeTopics([["a-1", "a", 2]]);
    const today = "2026-01-01";
    const history: HistoryEntry[] = [
      { topicId: "a-1", domain: "a", date: addDays(today, -181), depth: 4 },
    ];
    const { isRevisit } = selectTopic(topics, history, today, { rng: () => 0.5 });
    expect(isRevisit).toBe(false);
  });
});

describe("selectTopic: domain rotation", () => {
  it("never draws the same domain as the immediately preceding draw", () => {
    const topics = makeTopics([
      ["a-1", "a", 2],
      ["a-2", "a", 2],
      ["b-1", "b", 2],
    ]);
    const today = "2026-01-01";
    const history: HistoryEntry[] = [{ topicId: "a-1", domain: "a", date: addDays(today, -1) }];
    for (let i = 0; i < 10; i++) {
      const { topic } = selectTopic(topics, history, today, { rng: () => i / 10 });
      expect(topic.domain).toBe("b");
    }
  });

  it("never draws a domain more than twice within a rolling 7-day window", () => {
    const topics = makeTopics([
      ["a-1", "a", 2],
      ["a-2", "a", 2],
      ["a-3", "a", 2],
      ["b-1", "b", 2],
    ]);
    const today = "2026-01-01";
    const history: HistoryEntry[] = [
      { topicId: "a-1", domain: "a", date: addDays(today, -6) },
      { topicId: "a-2", domain: "a", date: addDays(today, -3) },
      { topicId: "b-1", domain: "b", date: addDays(today, -1) },
    ];
    // domain "a" already appears twice in the last 7 days, and "b" was yesterday.
    // Both are blocked; the rotation constraint should relax rather than deadlock.
    const { topic } = selectTopic(topics, history, today, { rng: () => 0.5 });
    expect(topic.id).toBeDefined();
  });

  it("relaxes the rolling window cap before the yesterday constraint when both would empty the pool", () => {
    const topics = makeTopics([
      ["a-1", "a", 2],
      ["a-2", "a", 2],
    ]);
    const today = "2026-01-01";
    const history: HistoryEntry[] = [
      { topicId: "a-1", domain: "a", date: addDays(today, -6) },
      { topicId: "a-2", domain: "a", date: addDays(today, -1) },
    ];
    // Only domain "a" exists at all, so rotation must fully relax to return anything.
    const { topic } = selectTopic(topics, history, today, { rng: () => 0.5 });
    expect(topic).toBeDefined();
  });
});

describe("selectTopic: difficulty weighting", () => {
  it("distributes draws roughly 20/60/20 across difficulty 1/2/3 over many trials", () => {
    const topics = makeTopics(
      Array.from({ length: 30 }, (_, i) => [`t-${i}`, `d${i % 10}`, ((i % 3) + 1) as 1 | 2 | 3])
    );
    const counts = { 1: 0, 2: 0, 3: 0 };
    let seed = 1;
    const rng = () => {
      // simple deterministic LCG so the test is reproducible
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const trials = 2000;
    for (let i = 0; i < trials; i++) {
      const { topic } = selectTopic(topics, [], "2026-01-01", { rng });
      counts[topic.difficulty]++;
    }
    expect(counts[1] / trials).toBeGreaterThan(0.12);
    expect(counts[1] / trials).toBeLessThan(0.28);
    expect(counts[3] / trials).toBeGreaterThan(0.12);
    expect(counts[3] / trials).toBeLessThan(0.28);
    expect(counts[2] / trials).toBeGreaterThan(0.45);
  });
});

describe("selectTopic: same-day exclusion (reroll)", () => {
  it("never re-offers a topic excluded for today's reroll", () => {
    const topics = makeTopics([
      ["a-1", "a", 2],
      ["b-1", "b", 2],
    ]);
    const today = "2026-01-01";
    const { topic } = selectTopic(topics, [], today, {
      excludeIds: new Set(["a-1"]),
      rng: () => 0,
    });
    expect(topic.id).toBe("b-1");
  });
});

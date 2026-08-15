// Pure: given the distinct dates (YYYY-MM-DD) a user completed a session on,
// sorted ascending, compute the current streak ending "today" (or "yesterday"
// if today's not done yet — a miss isn't detected until a day is fully skipped).
export function computeStreak(sortedDates: string[], today: string): number {
  if (sortedDates.length === 0) return 0;
  const set = new Set(sortedDates);

  const addDays = (date: string, n: number): string => {
    const d = new Date(date + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };

  let cursor = set.has(today) ? today : addDays(today, -1);
  if (!set.has(cursor)) return 0;

  let count = 0;
  while (set.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

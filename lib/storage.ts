import { TodayState } from "./types";

const KEYS = {
  streak: "drill:streak",
  reroll: "drill:reroll",
  today: "drill:today",
} as const;

interface StreakState {
  count: number;
  lastCompletedDate: string | null;
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getStreak(): StreakState {
  return read<StreakState>(KEYS.streak) ?? { count: 0, lastCompletedDate: null };
}

export function recordStreakCompletion(date: string): StreakState {
  const state = getStreak();
  if (state.lastCompletedDate === date) return state;
  const yesterday = (() => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();
  const nextCount = state.lastCompletedDate === yesterday ? state.count + 1 : 1;
  const next: StreakState = { count: nextCount, lastCompletedDate: date };
  write(KEYS.streak, next);
  return next;
}

export function getRerollUsed(date: string): boolean {
  const state = read<{ date: string; used: boolean }>(KEYS.reroll);
  if (!state || state.date !== date) return false;
  return state.used;
}

export function markRerollUsed(date: string): void {
  write(KEYS.reroll, { date, used: true });
}

export function getTodayState(): TodayState | null {
  return read<TodayState>(KEYS.today);
}

export function setTodayState(state: TodayState): void {
  write(KEYS.today, state);
}

export function clearTodayState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEYS.today);
}

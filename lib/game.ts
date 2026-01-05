import { Guess, WeekWord } from "@prisma/client";
import { getDayIndex, getNyParts, getWeekStart, isoDate, nowInTz, parseISODateOnlyToUTCDate } from "./time";

export const POINTS_BY_DAY = [5, 4, 3, 2, 1];

export function currentWeekStartIso(date = nowInTz()): string {
  return isoDate(getWeekStart(date));
}

export function ensureMonday(date: string) {
  const parsed = parseISODateOnlyToUTCDate(date);
  const weekday = parsed.getUTCDay(); // 0 = Sunday, 1 = Monday
  if (weekday !== 1) {
    throw new Error("weekStartDate must be a Monday (YYYY-MM-DD)");
  }
}

export function availableClues(week: WeekWord, dayIndex: number) {
  const clues = [week.clue1, week.clue2, week.clue3, week.clue4, week.clue5];
  return clues.slice(0, Math.min(dayIndex + 1, clues.length));
}

export function isAfterFriday(date = nowInTz()) {
  const parts = getNyParts(date);
  if (parts.weekday > 5) return true; // Saturday or Sunday
  if (parts.weekday < 5) return false; // Before Friday
  return parts.hour >= 23 && parts.minute >= 59;
}

export function normalizeWord(value: string) {
  return value.trim().toLowerCase();
}

export function hasGuessedToday(guesses: Guess[], date = nowInTz()): boolean {
  const todayIso = isoDate(date);
  return guesses.some((g) => isoDate(g.createdAt) === todayIso);
}

export function dayIndexForDate(date = nowInTz()): number {
  return getDayIndex(date);
}

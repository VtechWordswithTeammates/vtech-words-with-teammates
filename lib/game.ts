import { DateTime } from "luxon";
import { WeekWord, Guess } from "@prisma/client";
import { TZ, getWeekStart, nowInTz } from "./time";

export const POINTS_BY_DAY = [5, 4, 3, 2, 1];

export function currentWeekStartIso(date = nowInTz()): string {
  return getWeekStart(date).toISODate() ?? "";
}

export function ensureMonday(date: string) {
  const dt = DateTime.fromISO(date, { zone: TZ });
  if (dt.weekday !== 1) {
    throw new Error("weekStartDate must be a Monday (YYYY-MM-DD)");
  }
}

export function availableClues(week: WeekWord, dayIndex: number) {
  const clues = [week.clue1, week.clue2, week.clue3, week.clue4, week.clue5];
  return clues.slice(0, Math.min(dayIndex + 1, clues.length));
}

export function isAfterFriday(date = nowInTz()) {
  return date.weekday > 5 || (date.weekday === 5 && date.hour >= 23 && date.minute >= 59);
}

export function normalizeWord(value: string) {
  return value.trim().toLowerCase();
}

export function hasGuessedToday(guesses: Guess[], date = nowInTz()): boolean {
  const today = date.toISODate();
  return guesses.some((g) => DateTime.fromJSDate(g.createdAt, { zone: TZ }).toISODate() === today);
}

export function dayIndexForDate(date = nowInTz()): number {
  // Monday = 0
  return date.weekday - 1;
}

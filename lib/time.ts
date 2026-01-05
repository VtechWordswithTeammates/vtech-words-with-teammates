import { DateTime } from "luxon";

export const TZ = "America/New_York";

export function nowInTz(): DateTime {
  return DateTime.now().setZone(TZ);
}

export function getWeekStart(date = nowInTz()): DateTime {
  const weekday = date.weekday; // 1 = Monday
  return date.startOf("day").minus({ days: weekday - 1 });
}

export function getDayIndex(date = nowInTz()): number {
  // Monday = 0, Friday = 4
  return date.weekday - 1;
}

export function dayRange(date = nowInTz()): { start: Date; end: Date } {
  const start = date.startOf("day");
  const end = date.endOf("day");
  return { start: start.toJSDate(), end: end.toJSDate() };
}

export function isoDate(date: DateTime): string {
  return date.toISODate() ?? "";
}

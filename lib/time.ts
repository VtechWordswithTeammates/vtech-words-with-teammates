const TZ = "America/New_York";

export type NyParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // Monday = 1 ... Sunday = 7
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short"
});

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function weekdayNameToNumber(name: string): number {
  switch (name.toLowerCase()) {
    case "mon":
      return 1;
    case "tue":
      return 2;
    case "wed":
      return 3;
    case "thu":
      return 4;
    case "fri":
      return 5;
    case "sat":
      return 6;
    case "sun":
      return 7;
    default:
      return 0;
  }
}

export function getNyParts(date: Date): NyParts {
  const parts = dateFormatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const weekdayName = weekdayFormatter.format(date);

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
    weekday: weekdayNameToNumber(weekdayName)
  };
}

function getNyOffsetMs(date: Date): number {
  const parts = getNyParts(date);
  const utcFromParts = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return date.getTime() - utcFromParts;
}

export function parseISODateOnlyToUTCDate(dateStr: string): Date {
  const ymd = dateStr.slice(0, 10);
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid weekStartDate: ${dateStr}`);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

export function nowInTz(): Date {
  return new Date();
}

export function getWeekStart(date = nowInTz()): Date {
  const parts = getNyParts(date);
  const dayIndex = Math.max(parts.weekday - 1, 0); // Monday = 0
  const startOfDayUtc = parseISODateOnlyToUTCDate(`${parts.year}-${pad(parts.month)}-${pad(parts.day)}`);
  return new Date(startOfDayUtc.getTime() - dayIndex * 24 * 60 * 60 * 1000);
}

export function getDayIndex(date = nowInTz()): number {
  const parts = getNyParts(date);
  return Math.max(parts.weekday - 1, 0);
}

export function dayRange(date = nowInTz()): { start: Date; end: Date } {
  const parts = getNyParts(date);
  const offset = getNyOffsetMs(date);
  const startMs = Date.UTC(parts.year, parts.month - 1, parts.day) - offset;
  const start = new Date(startMs);
  const end = new Date(startMs + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

export function isoDate(date: Date): string {
  const parts = getNyParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export { TZ };

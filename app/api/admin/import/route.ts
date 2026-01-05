import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { containsProfanity } from "@/lib/profanity";
import { ensureMonday, normalizeWord } from "@/lib/game";
import { TZ } from "@/lib/time";
import { isAdminAuthed } from "@/lib/auth";

/**
 * Convert YYYY-MM-DD (or ISO date string) to a JS Date that represents
 * the start of that day (00:00:00) in the given IANA timezone (TZ).
 *
 * This avoids Luxon entirely, but still respects timezones + DST.
 */
function startOfDayInTimeZone(dateStr: string, timeZone: string): Date {
  // Accept "YYYY-MM-DD" and also ISO strings like "YYYY-MM-DDTHH:mm:ssZ"
  const ymd = dateStr.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) throw new Error(`Invalid date format: ${dateStr}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // This is "local midnight" expressed as if it were UTC (a reference point).
  const localMidnightAsUTC = Date.UTC(year, month - 1, day, 0, 0, 0);

  const getOffsetMinutes = (utcMillis: number) => {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    const parts = dtf.formatToParts(new Date(utcMillis));
    const map: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== "literal") map[p.type] = p.value;
    }

    const asUTC = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
      Number(map.second)
    );

    // Offset in minutes between TZ-local time and UTC at this instant
    return (asUTC - utcMillis) / 60000;
  };

  // Iteratively refine (handles DST boundaries correctly)
  let utcMillis = localMidnightAsUTC;
  for (let i = 0; i < 2; i++) {
    const offsetMin = getOffsetMinutes(utcMillis);
    utcMillis = localMidnightAsUTC - offsetMin * 60_000;
  }

  return new Date(utcMillis);
}

const wordSchema = z.object({
  weekStartDate: z.string().min(8),
  secretWord: z.string().min(2),
  clue1: z.string(),
  clue2: z.string(),
  clue3: z.string(),
  clue4: z.string(),
  clue5: z.string(),
  isPublished: z.boolean().optional().default(false)
});

const schema = z.object({ items: z.array(wordSchema) });

export async function POST(req: Request) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const records = parsed.data.items;

  const prepared = [] as {
    weekStartDate: Date;
    secretWord: string;
    clue1: string;
    clue2: string;
    clue3: string;
    clue4: string;
    clue5: string;
    isPublished: boolean;
  }[];

  for (const item of records) {
    try {
      ensureMonday(item.weekStartDate);
    } catch (err) {
      return NextResponse.json({ message: (err as Error).message }, { status: 400 });
    }

    if (item.secretWord.includes("-")) {
      return NextResponse.json(
        { message: `Secret word for ${item.weekStartDate} contains hyphen` },
        { status: 400 }
      );
    }

    if (containsProfanity(item.secretWord)) {
      return NextResponse.json(
        { message: `Secret word for ${item.weekStartDate} is not allowed` },
        { status: 400 }
      );
    }

    const clueList = [item.clue1, item.clue2, item.clue3, item.clue4, item.clue5];
    if (clueList.some((c) => containsProfanity(c))) {
      return NextResponse.json(
        { message: `Clues for ${item.weekStartDate} contain profanity` },
        { status: 400 }
      );
    }

    prepared.push({
      weekStartDate: startOfDayInTimeZone(item.weekStartDate, TZ),
      secretWord: normalizeWord(item.secretWord),
      clue1: item.clue1,
      clue2: item.clue2,
      clue3: item.clue3,
      clue4: item.clue4,
      clue5: item.clue5,
      isPublished: item.isPublished ?? false
    });
  }

  for (const payload of prepared) {
    await prisma.weekWord.upsert({
      where: { weekStartDate: payload.weekStartDate },
      create: payload,
      update: payload
    });
  }

  return NextResponse.json({ message: `Imported ${prepared.length} week(s)` });
}

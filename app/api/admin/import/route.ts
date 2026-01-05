import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { containsProfanity } from "@/lib/profanity";
import { ensureMonday, normalizeWord } from "@/lib/game";
import { isAdminAuthed } from "@/lib/auth";

const wordSchema = z.object({
  weekStartDate: z.string().min(8), // expecting YYYY-MM-DD
  secretWord: z.string().min(2),
  clue1: z.string(),
  clue2: z.string(),
  clue3: z.string(),
  clue4: z.string(),
  clue5: z.string(),
  isPublished: z.boolean().optional().default(false),
});

const schema = z.object({ items: z.array(wordSchema) });

function toUtcDateOnly(isoDate: string): Date {
  // Expect strict YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) throw new Error("weekStartDate must be in YYYY-MM-DD format");

  const year = Number(m[1]);
  const month = Number(m[2]); // 1-12
  const day = Number(m[3]);   // 1-31

  // Store as UTC midnight so it's stable across timezones
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

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

  const prepared: {
    weekStartDate: Date;
    secretWord: string;
    clue1: string;
    clue2: string;
    clue3: string;
    clue4: string;
    clue5: string;
    isPublished: boolean;
  }[] = [];

  for (const item of records) {
    try {
      ensureMonday(item.weekStartDate);
    } catch (err) {
      return NextResponse.json(
        { message: (err as Error).message },
        { status: 400 }
      );
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
      weekStartDate: toUtcDateOnly(item.weekStartDate),
      secretWord: normalizeWord(item.secretWord),
      clue1: item.clue1,
      clue2: item.clue2,
      clue3: item.clue3,
      clue4: item.clue4,
      clue5: item.clue5,
      isPublished: item.isPublished ?? false,
    });
  }

  for (const payload of prepared) {
    await prisma.weekWord.upsert({
      where: { weekStartDate: payload.weekStartDate },
      create: payload,
      update: payload,
    });
  }

  return NextResponse.json({ message: `Imported ${prepared.length} week(s)` });
}

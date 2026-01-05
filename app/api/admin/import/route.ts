import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { containsProfanity } from "@/lib/profanity";
import { ensureMonday, normalizeWord } from "@/lib/game";
import { isAdminAuthed } from "@/lib/auth";

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

function parseISODateOnlyToUTCDate(dateStr: string): Date {
  const ymd = dateStr.slice(0, 10);
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid weekStartDate: ${dateStr}`);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
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
      return NextResponse.json({ message: `Secret word for ${item.weekStartDate} contains hyphen` }, { status: 400 });
    }
    if (containsProfanity(item.secretWord)) {
      return NextResponse.json({ message: `Secret word for ${item.weekStartDate} is not allowed` }, { status: 400 });
    }
    const clueList = [item.clue1, item.clue2, item.clue3, item.clue4, item.clue5];
    if (clueList.some((c) => containsProfanity(c))) {
      return NextResponse.json({ message: `Clues for ${item.weekStartDate} contain profanity` }, { status: 400 });
    }

    prepared.push({
      weekStartDate: parseISODateOnlyToUTCDate(item.weekStartDate),
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

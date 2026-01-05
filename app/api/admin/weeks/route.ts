import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { containsProfanity } from "@/lib/profanity";
import { ensureMonday, normalizeWord } from "@/lib/game";
import { isAdminAuthed } from "@/lib/auth";
import { parseISODateOnlyToUTCDate } from "@/lib/time";

const schema = z.object({
  weekStartDate: z.string().min(8),
  secretWord: z.string().min(2).max(40),
  clue1: z.string().min(1),
  clue2: z.string().min(1),
  clue3: z.string().min(1),
  clue4: z.string().min(1),
  clue5: z.string().min(1),
  isPublished: z.boolean()
});

export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const weeks = await prisma.weekWord.findMany({ orderBy: { weekStartDate: "desc" } });
  return NextResponse.json(weeks);
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

  const data = parsed.data;
  try {
    ensureMonday(data.weekStartDate);
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }

  if (data.secretWord.includes("-")) {
    return NextResponse.json({ message: "Secret words cannot contain hyphens" }, { status: 400 });
  }

  if (containsProfanity(data.secretWord)) {
    return NextResponse.json({ message: "Secret word not allowed" }, { status: 400 });
  }

  const clues = [data.clue1, data.clue2, data.clue3, data.clue4, data.clue5];
  if (clues.some((clue) => containsProfanity(clue))) {
    return NextResponse.json({ message: "Clues contain blocked language" }, { status: 400 });
  }

  const weekDate = parseISODateOnlyToUTCDate(data.weekStartDate);

  const payload = {
    weekStartDate: weekDate,
    secretWord: normalizeWord(data.secretWord),
    clue1: data.clue1,
    clue2: data.clue2,
    clue3: data.clue3,
    clue4: data.clue4,
    clue5: data.clue5,
    isPublished: data.isPublished
  };

  const saved = await prisma.weekWord.upsert({
    where: { weekStartDate: weekDate },
    create: payload,
    update: payload
  });

  return NextResponse.json(saved);
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { DateTime } from "luxon";
import { prisma } from "@/lib/prisma";
import { containsProfanity } from "@/lib/profanity";
import { ensureMonday, normalizeWord } from "@/lib/game";
import { TZ } from "@/lib/time";
import { isAdminAuthed } from "@/lib/auth";

const schema = z.object({
  guess: z.string().min(1).max(40)
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const guess = parsed.data.guess.trim();
  if (containsProfanity(guess)) {
    return NextResponse.json({ message: "Guess contains blocked language" }, { status: 400 });
  }

  const now = nowInTz();
  const weekStart = getWeekStart(now).toJSDate();
  const week = await prisma.weekWord.findUnique({ where: { weekStartDate: weekStart } });

  if (!week || !week.isPublished) {
    return NextResponse.json({ message: "No active word this week" }, { status: 400 });
  }

  const { start, end } = dayRange(now);

  const alreadyCorrect = await prisma.guess.findFirst({
    where: { userId: session.userId, weekWordId: week.id, isCorrect: true }
  });

  if (alreadyCorrect) {
    return NextResponse.json({ message: "You already solved this week!" }, { status: 200 });
  }

  const guessToday = await prisma.guess.findFirst({
    where: {
      userId: session.userId,
      weekWordId: week.id,
      createdAt: { gte: start, lte: end }
    }
  });

  if (guessToday) {
    return NextResponse.json({ message: "You already guessed today" }, { status: 400 });
  }

  const normalizedGuess = normalizeWord(guess);
  const normalizedSecret = normalizeWord(week.secretWord);
  const isCorrect = normalizedGuess === normalizedSecret;
  const dayIndex = now.weekday - 1;
  const pointsAwarded = isCorrect ? POINTS_BY_DAY[dayIndex] ?? 0 : 0;

  await prisma.guess.create({
    data: {
      guess,
      isCorrect,
      pointsAwarded,
      userId: session.userId,
      weekWordId: week.id
    }
  });

  return NextResponse.json({
    message: isCorrect ? `Correct! +${pointsAwarded} points` : "Wrong guess. Try again tomorrow.",
    isCorrect,
    pointsAwarded
  });
}

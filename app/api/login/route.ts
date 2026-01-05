import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { containsProfanity } from "@/lib/profanity";
import { createSession } from "@/lib/auth";

const schema = z.object({
  displayName: z.string().min(2).max(40),
  teamCode: z.string().min(1)
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const { displayName, teamCode } = parsed.data;
  if (teamCode !== env.TEAM_CODE) {
    return NextResponse.json({ message: "Invalid team code" }, { status: 401 });
  }

  if (containsProfanity(displayName)) {
    return NextResponse.json({ message: "Display name not allowed" }, { status: 400 });
  }

  const trimmedName = displayName.trim();
  let user = await prisma.user.findUnique({ where: { displayName: trimmedName } });
  if (!user) {
    user = await prisma.user.create({ data: { displayName: trimmedName } });
  }

  await createSession(user.id);

  return NextResponse.json({ message: "Logged in", user: { id: user.id, displayName: user.displayName } });
}

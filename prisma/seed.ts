import { prisma } from "../lib/prisma";
import { normalizeWord } from "../lib/game";
import { getWeekStart, nowInTz } from "../lib/time";

async function main() {
  const now = nowInTz();
  const weekStart = getWeekStart(now).toJSDate();

  await prisma.weekWord.upsert({
    where: { weekStartDate: weekStart },
    update: {},
    create: {
      weekStartDate: weekStart,
      secretWord: normalizeWord("teamwork"),
      clue1: "We do this together",
      clue2: "A group effort",
      clue3: "It makes the dream work",
      clue4: "Collaboration's cousin",
      clue5: "Opposite of solo",
      isPublished: true
    }
  });

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

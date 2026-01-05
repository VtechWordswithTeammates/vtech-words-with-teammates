import { prisma } from "@/lib/prisma";
import { availableClues, dayIndexForDate, POINTS_BY_DAY } from "@/lib/game";
import { dayRange, getWeekStart, nowInTz } from "@/lib/time";
import { getSession } from "@/lib/auth";
import LoginForm from "./components/LoginForm";
import GuessForm from "./components/GuessForm";
import Leaderboard from "./components/Leaderboard";
import Link from "next/link";

export default async function HomePage() {
  const session = await getSession();
  const now = nowInTz();
  const dayIndex = dayIndexForDate(now);
  const weekStart = getWeekStart(now).toJSDate();

  const week = await prisma.weekWord.findUnique({
    where: { weekStartDate: weekStart },
    include: {
      guesses: {
        include: { user: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  const leaderboardData = await buildLeaderboard(session?.userId);

  if (!session) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Vtech Words with Teammates</h1>
              <p className="text-slate-400">Log in with your display name and team code to start guessing.</p>
            </div>
          </header>
          <section className="card">
            <LoginForm />
          </section>
        </div>
        <Leaderboard data={leaderboardData} />
      </main>
    );
  }

  if (!week || !week.isPublished) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Vtech Words with Teammates</h1>
              <p className="text-slate-400">Hi {session.user.displayName}! There is no published word for this week yet.</p>
            </div>
            <Link className="btn-secondary" href="/admin">Admin</Link>
          </header>
          <section className="card">
            <p className="text-slate-200">Check back soon for this week&apos;s challenge.</p>
          </section>
        </div>
        <Leaderboard data={leaderboardData} />
      </main>
    );
  }

  const userGuesses = await prisma.guess.findMany({
    where: { userId: session.userId, weekWordId: week.id },
    orderBy: { createdAt: "desc" }
  });

  const solved = userGuesses.some((g) => g.isCorrect);
  const { start, end } = dayRange(now);
  const guessToday = userGuesses.find((g) => g.createdAt >= start && g.createdAt <= end);
  const clues = availableClues(week, dayIndex);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vtech Words with Teammates</h1>
            <p className="text-slate-400">
              Welcome back, {session.user.displayName}! Weekly word starts {weekStart.toISOString().slice(0, 10)} (NY timezone).
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Link className="btn-secondary" href="/admin">
              Admin
            </Link>
            <form action="/api/logout" method="post">
              <button className="btn-secondary" type="submit">
                Logout
              </button>
            </form>
          </div>
        </header>

        <section className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">This week&apos;s clues</h2>
              <p className="text-slate-400">One clue unlocks per weekday (America/New_York).</p>
            </div>
            <div className="text-sm text-slate-400">Points today: {POINTS_BY_DAY[dayIndex] ?? 0}</div>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-slate-100">
            {clues.map((clue, idx) => (
              <li key={idx} className="bg-slate-800 rounded-md px-3 py-2">
                {clue}
              </li>
            ))}
          </ol>
          {clues.length < 5 && <p className="text-slate-500 text-sm">Remaining clues unlock each weekday.</p>}
        </section>

        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Submit your guess</h2>
              <p className="text-slate-400">One guess per day. Wrong guesses lock you out until tomorrow.</p>
            </div>
            {solved && <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300">Solved!</span>}
          </div>
          <GuessForm
            disabled={!!guessToday || solved}
            solved={solved}
            guessToday={guessToday}
            dayPoints={POINTS_BY_DAY[dayIndex] ?? 0}
          />
        </section>

        <section className="card space-y-2">
          <h2 className="text-xl font-semibold">Recent guesses</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Guess</th>
                  <th>Result</th>
                  <th>Date (NY)</th>
                </tr>
              </thead>
              <tbody>
                {week.guesses.slice(0, 15).map((g) => (
                  <tr key={g.id} className="border-b border-slate-800 last:border-0">
                    <td className="pr-4">{g.user.displayName}</td>
                    <td className="pr-4 font-semibold">{g.guess}</td>
                    <td className="pr-4">
                      {g.isCorrect ? (
                        <span className="text-emerald-400 font-semibold">Correct (+{g.pointsAwarded})</span>
                      ) : (
                        <span className="text-rose-400">Wrong</span>
                      )}
                    </td>
                    <td className="text-slate-400">
                      {new Date(g.createdAt).toLocaleString("en-US", { timeZone: "America/New_York" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">Secret word comparison is case-insensitive and rejects hyphenated secrets.</p>
        </section>

        {solved && (
          <section className="card">
            <p className="text-emerald-300 font-semibold">
              Great job! You already solved this week. The secret word was <strong>{week.secretWord}</strong>.
            </p>
          </section>
        )}
      </div>

      <Leaderboard data={leaderboardData} />
    </main>
  );
}

async function buildLeaderboard(currentUserId?: string) {
  const grouped = await prisma.guess.groupBy({
    by: ["userId"],
    _sum: { pointsAwarded: true },
    orderBy: { _sum: { pointsAwarded: "desc" } }
  });

  const userIds = grouped.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true }
  });

  const leaderboard = grouped
    .map((g) => ({
      userId: g.userId,
      points: g._sum.pointsAwarded ?? 0,
      displayName: users.find((u) => u.id === g.userId)?.displayName ?? "Unknown"
    }))
    .sort((a, b) => b.points - a.points);

  const currentIndex = leaderboard.findIndex((l) => l.userId === currentUserId);
  return {
    entries: leaderboard.slice(0, 10),
    currentRank: currentIndex >= 0 ? currentIndex + 1 : null,
    currentPoints: currentIndex >= 0 ? leaderboard[currentIndex].points : 0
  };
}

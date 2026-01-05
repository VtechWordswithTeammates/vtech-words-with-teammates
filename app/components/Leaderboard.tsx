interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
}

interface Props {
  data: {
    entries: LeaderboardEntry[];
    currentRank: number | null;
    currentPoints: number;
  };
}

export default function Leaderboard({ data }: Props) {
  return (
    <aside className="card h-fit space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        <p className="text-slate-400 text-sm">Top 10 all-time</p>
      </div>
      <ol className="space-y-2">
        {data.entries.map((entry, idx) => (
          <li key={entry.userId} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 w-5">{idx + 1}.</span>
              <span className="font-semibold">{entry.displayName}</span>
            </div>
            <span className="text-accent font-semibold">{entry.points} pts</span>
          </li>
        ))}
        {data.entries.length === 0 && <p className="text-slate-400">No scores yet.</p>}
      </ol>
      {data.currentRank !== null && (
        <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm">
          Your rank: <strong>#{data.currentRank}</strong> with {data.currentPoints} pts
        </div>
      )}
    </aside>
  );
}

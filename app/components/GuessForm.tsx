"use client";

import { Guess } from "@prisma/client";
import { useState } from "react";

interface Props {
  disabled: boolean;
  solved: boolean;
  guessToday?: Guess;
  dayPoints: number;
}

export default function GuessForm({ disabled, solved, guessToday, dayPoints }: Props) {
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setMessage(null);
    setError(null);
    setLoading(true);

    const res = await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guess })
    });

    setLoading(false);
    const data = await res.json().catch(() => ({ message: "Unable to submit" }));
    if (res.ok) {
      setMessage(data.message || `Submitted${data.isCorrect ? " - correct!" : ""}`);
      setGuess("");
      window.location.reload();
    } else {
      setError(data.message || "Unable to submit guess");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Your guess</label>
        <input
          className="w-full bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Enter the weekly word"
          disabled={disabled || loading}
          maxLength={40}
          required
        />
        <p className="text-xs text-slate-500 mt-1">Case-insensitive. Points today: {dayPoints}</p>
      </div>
      {message && <p className="text-emerald-400 text-sm">{message}</p>}
      {error && <p className="text-rose-400 text-sm">{error}</p>}
      {guessToday && !guessToday.isCorrect && (
        <p className="text-amber-300 text-sm">You already guessed today. Try again tomorrow.</p>
      )}
      {solved && <p className="text-emerald-400 text-sm">You solved this week&apos;s word already!</p>}
      <button className="btn-primary" type="submit" disabled={disabled || loading}>
        {loading ? "Submitting..." : solved ? "Solved" : "Submit guess"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";

export default function LoginForm() {
  const [displayName, setDisplayName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, teamCode })
    });

    setLoading(false);
    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({ message: "Unable to login" }));
      setError(data.message || "Unable to login");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Display name</label>
        <input
          className="w-full bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          maxLength={40}
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Team code</label>
        <input
          className="w-full bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
          value={teamCode}
          onChange={(e) => setTeamCode(e.target.value)}
          required
          type="password"
          placeholder="Shared TEAM_CODE"
        />
      </div>
      {error && <p className="text-rose-400 text-sm">{error}</p>}
      <button className="btn-primary w-full" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

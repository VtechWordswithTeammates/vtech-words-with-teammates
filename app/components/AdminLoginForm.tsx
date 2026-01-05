"use client";

import { useState } from "react";

export default function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
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
        <label className="block text-sm text-slate-300 mb-1">Admin password</label>
        <input
          className="w-full bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-rose-400 text-sm">{error}</p>}
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in as admin"}
      </button>
    </form>
  );
}

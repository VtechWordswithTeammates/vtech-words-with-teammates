"use client";

import { useState } from "react";

export default function WordBankImporter() {
  const [jsonInput, setJsonInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (err) {
      setError("Invalid JSON payload");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: parsed })
    });

    setLoading(false);
    const data = await res.json().catch(() => ({ message: "Unable to import" }));
    if (res.ok) {
      setMessage(data.message || "Imported successfully");
      window.location.reload();
    } else {
      setError(data.message || "Unable to import");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleImport}>
      <div>
        <label className="block text-sm text-slate-300 mb-1">JSON word bank</label>
        <textarea
          className="w-full min-h-[200px] bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
          placeholder='[{"weekStartDate":"2024-12-30","secretWord":"planet","clue1":"...","clue2":"...","clue3":"...","clue4":"...","clue5":"...","isPublished":false}]'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          required
        />
      </div>
      {message && <p className="text-emerald-400 text-sm">{message}</p>}
      {error && <p className="text-rose-400 text-sm">{error}</p>}
      <button className="btn-secondary" type="submit" disabled={loading}>
        {loading ? "Importing..." : "Import word bank"}
      </button>
    </form>
  );
}

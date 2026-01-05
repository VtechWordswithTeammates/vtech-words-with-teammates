"use client";

import { useMemo, useState } from "react";

interface SerializedWeek {
  id: string;
  weekStartDate: string;
  secretWord: string;
  clue1: string;
  clue2: string;
  clue3: string;
  clue4: string;
  clue5: string;
  isPublished: boolean;
}

interface Props {
  weeks: SerializedWeek[];
}

const emptyWeek = {
  weekStartDate: "",
  secretWord: "",
  clue1: "",
  clue2: "",
  clue3: "",
  clue4: "",
  clue5: "",
  isPublished: false
};

export default function WeekManager({ weeks }: Props) {
  const [form, setForm] = useState({ ...emptyWeek });
  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sortedWeeks = useMemo(() => {
    return [...weeks].sort(
      (a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
    );
  }, [weeks]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setStatus(null);
    setError(null);
    if (id === "new") {
      setForm({ ...emptyWeek });
      return;
    }
    const week = weeks.find((w) => w.id === id);
    if (!week) return;
    const weekDate = week.weekStartDate.slice(0, 10);
    setForm({
      weekStartDate: weekDate,
      secretWord: week.secretWord,
      clue1: week.clue1,
      clue2: week.clue2,
      clue3: week.clue3,
      clue4: week.clue4,
      clue5: week.clue5,
      isPublished: week.isPublished
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/weeks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form })
    });

    setLoading(false);
    const data = await res.json().catch(() => ({ message: "Unable to save" }));
    if (res.ok) {
      setStatus("Saved successfully");
      window.location.reload();
    } else {
      setError(data.message || "Unable to save");
    }
  };

  const togglePublish = async (week: SerializedWeek) => {
    setLoading(true);
    setStatus(null);
    setError(null);
    const res = await fetch("/api/admin/weeks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekStartDate: week.weekStartDate.slice(0, 10),
        secretWord: week.secretWord,
        clue1: week.clue1,
        clue2: week.clue2,
        clue3: week.clue3,
        clue4: week.clue4,
        clue5: week.clue5,
        isPublished: !week.isPublished
      })
    });
    setLoading(false);
    const data = await res.json().catch(() => ({ message: "Unable to update" }));
    if (res.ok) {
      setStatus("Publication updated");
      window.location.reload();
    } else {
      setError(data.message || "Unable to update");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
          value={selectedId}
          onChange={(e) => handleSelect(e.target.value)}
        >
          <option value="new">Create new week</option>
          {sortedWeeks.map((week) => (
            <option key={week.id} value={week.id}>
              {week.weekStartDate.slice(0, 10)} {week.isPublished ? "(Published)" : ""}
            </option>
          ))}
        </select>
      </div>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Week start (Monday, YYYY-MM-DD)</label>
          <input
            className="w-full bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
            type="date"
            value={form.weekStartDate}
            onChange={(e) => setForm({ ...form, weekStartDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Secret word (no hyphens)</label>
          <input
            className="w-full bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
            value={form.secretWord}
            onChange={(e) => setForm({ ...form, secretWord: e.target.value })}
            required
            maxLength={40}
          />
        </div>
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} className="md:col-span-1">
            <label className="block text-sm text-slate-300 mb-1">Clue {num}</label>
            <input
              className="w-full bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
              value={(form as any)[`clue${num}`]}
              onChange={(e) => setForm({ ...form, [`clue${num}`]: e.target.value } as any)}
              required
              maxLength={120}
            />
          </div>
        ))}
        <div className="md:col-span-2 flex items-center gap-2">
          <input
            id="published"
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          />
          <label htmlFor="published" className="text-slate-200">
            Published (visible to players)
          </label>
        </div>
        {status && <p className="text-emerald-400 text-sm md:col-span-2">{status}</p>}
        {error && <p className="text-rose-400 text-sm md:col-span-2">{error}</p>}
        <button className="btn-primary md:col-span-2" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save week"}
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="font-semibold">Existing weeks</h3>
        <div className="space-y-2">
          {sortedWeeks.map((week) => (
            <div key={week.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
              <div>
                <p className="font-semibold">{week.weekStartDate.toISOString().slice(0, 10)}</p>
                <p className="text-xs text-slate-400">{week.secretWord} • {week.isPublished ? "Published" : "Draft"}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" type="button" onClick={() => handleSelect(week.id)}>
                  Edit
                </button>
                <button className="btn-primary" type="button" onClick={() => togglePublish(week)} disabled={loading}>
                  {week.isPublished ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          ))}
          {sortedWeeks.length === 0 && <p className="text-slate-400">No weeks yet.</p>}
        </div>
      </div>
    </div>
  );
}

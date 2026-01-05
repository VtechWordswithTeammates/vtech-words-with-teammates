import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/auth";
import AdminLoginForm from "../components/AdminLoginForm";
import WeekManager from "../components/WeekManager";
import WordBankImporter from "../components/WordBankImporter";

export default async function AdminPage() {
  const authed = isAdminAuthed();

  if (!authed) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin</h1>
            <p className="text-slate-400">Protected by ADMIN_PASSWORD</p>
          </div>
          <Link href="/" className="btn-secondary">
            Back to game
          </Link>
        </div>
        <section className="card">
          <AdminLoginForm />
        </section>
      </main>
    );
  }

  const weeks = await prisma.weekWord.findMany({ orderBy: { weekStartDate: "desc" } });
  const serializedWeeks = weeks.map((week) => ({
    id: week.id,
    weekStartDate: week.weekStartDate.toISOString(),
    secretWord: week.secretWord,
    clue1: week.clue1,
    clue2: week.clue2,
    clue3: week.clue3,
    clue4: week.clue4,
    clue5: week.clue5,
    isPublished: week.isPublished
  }));

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin dashboard</h1>
          <p className="text-slate-400">Create, edit, and publish weekly words.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="btn-secondary">
            Back
          </Link>
          <form action="/api/admin/login" method="post">
            <button className="btn-secondary" name="logout" value="true" type="submit">
              Logout admin
            </button>
          </form>
        </div>
      </div>

      <section className="card">
        <WeekManager weeks={serializedWeeks} />
      </section>

      <section className="card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-semibold">Import word bank</h2>
            <p className="text-slate-400 text-sm">Upload JSON array with weekStartDate, secretWord, clues, and isPublished.</p>
          </div>
        </div>
        <WordBankImporter />
      </section>
    </main>
  );
}

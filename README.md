# Vtech Words with Teammates

Production-ready weekly word-guessing game built with Next.js (App Router), TypeScript, Tailwind CSS, and Prisma.

## Features
- One shared secret word per week with five weekday clues (America/New_York timezone).
- One guess per player per day; wrong guesses lock only that day.
- Points by day: Mon 5, Tue 4, Wed 3, Thu 2, Fri 1; unsolved by Friday earns 0.
- Case-insensitive word checks, profanity filtering, and secret-word hyphen blocking.
- Login with display name + shared `TEAM_CODE`; secure HTTP-only cookie sessions.
- Admin dashboard (protected by `ADMIN_PASSWORD`) to create/edit/publish weeks and import word banks.
- Leaderboard showing all-time top 10 plus your rank/points.
- Prisma ORM with SQLite locally and PostgreSQL (Supabase) in production.

## Getting started (local development)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create an `.env` by copying the template and updating values:
   ```bash
   cp .env.example .env
   ```
3. Run database migrations and seed data:
   ```bash
   npx prisma migrate dev --name init
   npm run seed
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000`.

### Scripts
- `npm run dev` – Start the Next.js dev server.
- `npm run lint` – Run ESLint.
- `npm run seed` – Execute the Prisma seed script (`prisma/seed.ts`).
- `npm run build` – **Required build command**: `prisma generate && next build`.
- `npm start` – Run the production server.

## Deployment (Vercel + Supabase)
1. **Database (Supabase/PostgreSQL):**
   - Create a new Supabase project.
   - Copy the `Connection string` (URI) and set it as `DATABASE_URL` in Vercel.
   - Set `DATABASE_PROVIDER=postgresql`.
   - Run migrations against Supabase (locally or via CI):
     ```bash
     npx prisma migrate deploy
     ```
   - Seed data as needed by running the seed script against the Supabase URL.
2. **Vercel configuration:**
   - Import the repo into Vercel.
   - Set environment variables in the project (`TEAM_CODE`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `DATABASE_URL`, `DATABASE_PROVIDER`).
   - Ensure the **Build Command** is `prisma generate && next build` (matches package.json).
   - Set **Install Command** to `npm install` (default) so Prisma client is generated.
3. **Runtime:**
   - The app uses secure HTTP-only cookies for player sessions and admin auth.
   - Timezone-sensitive logic relies on America/New_York.

## Admin & gameplay notes
- Admin dashboard lives at `/admin` and is gated by `ADMIN_PASSWORD`.
- Weekly entries require a Monday `weekStartDate` (`YYYY-MM-DD`).
- Secret words must not contain hyphens and are stored normalized for case-insensitive comparison.
- The word bank importer accepts a JSON array with `weekStartDate`, `secretWord`, `clue1`–`clue5`, and optional `isPublished`.
- Profanity is blocked for display names, secret words, clues, and guesses.

## Tech stack
- Next.js (App Router) + React 18
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (dev) / PostgreSQL (prod)

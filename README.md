# Drill

A daily research-and-speak drill: draw a topic, get 15 minutes to research it
yourself, then speak about it for 60 seconds from memory with your notes
hard-locked away. Self-score afterward. No AI assistance anywhere in the
running app — the only AI involvement was one-time, offline generation of the
800-topic bank.

## Local development

```bash
npm install
npm run generate:topics   # only needed once, topics.json is already committed
```

You need a Postgres database for accounts and session data. Easiest local
option — a real local Postgres server, zero cloud signup required:

```bash
npx prisma dev            # prints a DATABASE_URL, leave it running
```

Copy `.env.example` to `.env` and paste that URL in, then:

```bash
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and go.

## Deploying (Vercel)

Drill's core app (Today/Score/Archive/Map) is safe to deploy publicly — it's
gated behind real accounts (email + password, bcrypt-hashed, httpOnly session
cookies). Steps:

1. Provision a production Postgres database. Either:
   - **Vercel Postgres** (Storage tab in your Vercel project → Create Database
     → Postgres), or
   - **Supabase** (you already use this for CollegeOS — a new project there
     works too; grab the connection string from Project Settings → Database).
2. Set `DATABASE_URL` (and `SESSION_COOKIE_NAME` if you want to change it) as
   Environment Variables in the Vercel project settings — not in a committed
   file.
3. Run `npx prisma migrate deploy` once against that production database
   (from your machine, with `DATABASE_URL` pointed at production) to create
   the tables.
4. Push to GitHub, import the repo into Vercel, deploy. No separate render
   server, no other backend service — the Postgres database is the only
   external dependency.

## The Brain feature — local only, do not deploy

`/brain` visualizes your own Claude.ai conversation history as a synapse
graph. It is intentionally **not part of the public deploy**:

- It's built from `data-import/conversations.json`, your unzipped Claude.ai
  data export — deeply private (business plans, academic records, personal
  life). That directory is gitignored and must never be committed.
- The generated graph data (`data/brain/synapses.json`) is also gitignored.
- `/brain` still sits behind the same login as the rest of the app, but you
  should only ever run it via `npm run dev` on your own machine, never on a
  public deployment, since the data pipeline itself depends on files that
  intentionally never leave your machine.

To (re)generate it: export your data from claude.ai (Settings → Data
controls → Export data), unzip into `data-import/`, then:

```bash
npm run generate:brain
```

## Stack

Next.js (App Router) + TypeScript + Tailwind. Postgres via Prisma 7 (driver
adapters, `@prisma/adapter-pg`). Auth is hand-rolled (bcrypt + session table +
httpOnly cookie) rather than a library, to avoid pulling in a dependency of
uncertain compatibility with this Next.js version.

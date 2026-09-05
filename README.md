# Project LOOP

**AI-powered customer feedback intelligence for modern product teams.**

Project LOOP turns raw customer feedback into clear, actionable insight. It ingests feedback from support tickets, app store reviews, surveys, sales calls and manual entry; classifies each item with AI; groups it into live themes; and answers natural-language questions about your customers using retrieval-augmented generation (RAG) over your own feedback data. On demand it produces an executive Voice-of-Customer report.

## Features

- **Multi-tenant workspaces** with full data isolation — every query is scoped to your workspace; the client never sends a workspace id.
- **AI feedback classification** — each incoming item is classified by Gemini (sentiment, category, priority, language) with a single automatic retry before failing loudly (never a silent fallback).
- **Theme detection & tracking** — auto-assigned themes with counts, positive/negative splits and a 30-day trend score; theme statistics are recomputed on assignment.
- **Ask LOOP (RAG Q&A)** — natural-language questions answered from your actual feedback. Offline 256-dim hashing TF embeddings power semantic retrieval with cosine similarity, backed by a keyword fallback; Gemini synthesizes the final answer with inline citations.
- **Voice-of-Customer reports** — generates an executive summary, theme/trend analysis, pain points and 3–5 recommended actions. Export as Markdown, CSV (underlying feedback) or PDF (browser print).
- **Dashboard analytics** — sentiment distribution, source breakdown, daily trends, theme leaderboard and computed AI insights.
- **CSV import** — file upload with client-side preview, server-side validation and confirmation.
- **Simulated feedback** — one-click generator for demos and testing.
- **Role-based access control** — `ADMIN`, `ANALYST`, `VIEWER` with per-route authorization (credentials login via NextAuth + Prisma adapter, bcrypt password hashing).
- **Responsive UI** — Tailwind CSS v4 + shadcn/ui components, Recharts visualizations.

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Framework  | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript |
| Database   | PostgreSQL via Prisma ORM 6 (`db push`, no migrations) |
| Auth       | NextAuth v4 (Credentials + PrismaAdapter, JWT sessions) |
| AI         | Google Gemini (via the Generative Language API) |
| Embeddings | Offline 256-dim hashing TF embeddings (no external embedding API) |
| UI         | Tailwind CSS v4, shadcn style components, Recharts, lucide-react |
| Validation | Zod |
| CSV        | PapaParse |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally (or a remote instance such as Neon / Supabase)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/project_loop?schema=public"
AUTH_SECRET="generate-a-long-random-string"
GEMINI_API_KEY="your-gemini-api-key-here"
AI_PROVIDER="gemini"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a reliable `AUTH_SECRET` with:

```bash
npx auth secret   # or: openssl rand -base64 32
```

### 3. Create the schema and seed demo data

```bash
npx prisma db push
npm run db:seed
```

The seed creates the `acme-corp` workspace, 8 themes, 3 users and 137 realistic feedback records with theme associations.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

| Role     | Email                        | Password |
|----------|------------------------------|----------|
| Admin    | `demo-admin@example.com`     | `demo1234` |
| Analyst  | `demo-analyst@example.com`   | `demo1234` |
| Viewer   | `demo-viewer@example.com`    | `demo1234` |

## Role-based access control

| Capability                          | VIEWER | ANALYST | ADMIN |
|-------------------------------------|:------:|:-------:|:-----:|
| View dashboard, feedback, themes, reports | ✅ | ✅ | ✅ |
| Ask LOOP questions                  | ✅ | ✅ | ✅ |
| Classify feedback / generate themes & reports | ❌ | ✅ | ✅ |
| Add / edit / delete feedback, CSV import, simulate | ❌ | ✅ | ✅ |
| Manage team members & workspace settings | ❌ | ❌ | ✅ |

## AI Architecture

```
Feedback in ──► Classification (Gemini, retry-once) ──► Theme assignment
      │                                                        │
      └────► offline embedding stored on Feedback.Embedding ───┘
                                                            │
Ask LOOP: question ──► query embedding ──► cosine top-k (25)
                        │ fallback if <5: keyword scoring
   Gemini synthesizes answer with cited feedback items

VoC report: workspace stats ──► Gemini (retry-once) ──► saved Report
```

- **Retry-once policy**: every AI call retries exactly once on failure; if both attempts fail the API returns a controlled error to the UI instead of inventing data.
- **Embeddings**: a local 256-dim hashing term-frequency vector is stored per feedback, so semantic search works with no external embedding cost. Missing embeddings are backfilled lazily (up to 150 per Ask LOOP call) via `ensureAllEmbeddings`.
- **Tenant isolation**: embedding similarity search and every Prisma query are scoped by `workspaceId` derived from the session.

## API Endpoints

All routes require session auth and enforce workspace isolation. `[A]` = ADMIN/ANALYST only.

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/feedback?page&pageSize&search&source&sentiment&status&category&from&to&sortBy` | Paginated filtered feedback list |
| `POST` | `/api/feedback` `[A]` | Create feedback |
| `GET/PATCH/DELETE` | `/api/feedback/[id]` | Read / update / delete one item (`PATCH`/`DELETE` are `[A]`) |
| `POST` | `/api/feedback/import` `[A]` | CSV import (server-side validated) |
| `POST` | `/api/feedback/simulate` `[A]` | Predefined simulated feedback batch |
| `GET`  | `/api/analytics` | Workspace analytics + time series + insights |
| `GET/POST` | `/api/themes` | Theme list / create (`POST` is `[A]`) |
| `PATCH/DELETE` | `/api/themes/[id]` `[A]` | Rename/delete theme + recompute stats |
| `POST` | `/api/ai/classify` `[A]` | AI-classify a batch of feedback |
| `POST` | `/api/ai/themes` `[A]` | Auto-detect themes from feedback |
| `POST` | `/api/ai/ask` | Ask LOOP natural-language Q&A (RAG) |
| `POST` | `/api/ai/report` `[A]` | Generate and save a VoC report |
| `GET/POST` | `/api/reports` `[A]` | List reports / generate new |
| `GET`  | `/api/reports/[id]` | Fetch one report |
| `GET`  | `/api/reports/[id]/export?format=csv\|markdown` | Export data (CSV) or report (Markdown) |
| `GET/PUT` | `/api/settings/workspace` | Workspace name (`PUT` is `[A]`) |
| `GET/PATCH/DELETE` | `/api/settings/team` | Team membership management (`[A]` except list) |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth session routes |
| `POST` | `/api/auth/register` | Create account |

## Project Structure

```
prisma/
  schema.prisma          # PostgreSQL models & enums
  seed.ts                # demo workspace, users, themes, 138 feedback items
src/
  app/
    (dashboard)/         # dashboard, feedback, analytics, themes, ask-loop,
                         #   reports, reports/[id], settings, settings/team
    api/                 # typed route handlers (auth-first, workspace-scoped)
    login.tsx, register.tsx, ... landing page
  components/            # shadcn/ui primitives + feature components (import dialog)
  lib/
    auth/                # auth options, helpers (requireAuth / requireRole)
    ai/                  # Gemini client, classify, ask (RAG), report
    embeddings/          # hashing TF embeddings + similarity search
    themes/              # theme assignment & stat recomputation
    analytics/           # workspace stats aggregation
  types/                 # shared API types + next-auth module augmentation
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (type-checks) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (strict, warnings-free) |
| `npm run db:seed` | Seed demo data |

## Deployment

1. Provision a managed PostgreSQL instance ([Neon](https://neon.tech) or [Supabase](https://supabase.com)), copy its connection string into `DATABASE_URL`.
2. `npx prisma db push` against the production database (or run once as a Vercel buildless step), then optionally `npm run db:seed`.
3. Deploy the app to Vercel (git integration or `vercel` CLI). Set the four environment variables in Vercel.
4. Set `NEXTAUTH_URL` to your production URL.

> Note: preview/edge functions are not required — the app runs on the Node server runtime with a standard Postgres connection.

## Security

- Passwords are hashed with **bcrypt**; sessions use JWT via NextAuth.
- Every data route re-authenticates the session server-side and scopes queries to the caller's `workspaceId` (tenant isolation).
- AI classification is deterministic-positive: after two attempts it returns an explicit error rather than a fabricated result.
- Sensitive keys live only in `.env` (git-ignored); `.env.example` holds placeholders.

## License

Private — for demonstration and internal use.
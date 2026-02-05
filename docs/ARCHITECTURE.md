# Bacau Scout — Full Architecture Documentation

Last updated: 2026-02-05

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [File Structure](#3-file-structure)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Pages & Routes](#5-pages--routes)
6. [Components](#6-components)
7. [Data Libraries](#7-data-libraries)
8. [API Endpoints](#8-api-endpoints)
9. [Database (Prisma/PostgreSQL)](#9-database)
10. [Grading System](#10-grading-system)
11. [Scraper Scripts](#11-scraper-scripts)
12. [Deployment](#12-deployment)
13. [Common Pitfalls & Gotchas](#13-common-pitfalls--gotchas)
14. [Known Issues & TODOs](#14-known-issues--todos)

---

## 1. Project Overview

Bacau Scout is a football scouting tool for evaluating players across 37 leagues. 15 scouts use it to search players, view profiles, and submit scouting reports with detailed attribute ratings.

**Live URL:** https://bacau-scout-production.up.railway.app
**Repo:** https://github.com/cryptikhunterz/bacau-scout (PRIVATE)
**Data:** 21,647 unique players, 39 leagues, 2025/26 season

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Auth | NextAuth v4 (credentials provider, bcrypt, JWT) |
| Database | PostgreSQL (Railway) |
| ORM | Prisma 6.19.2 |
| Player Data | Static JSON (`public/players.json`) |
| Scraping | Python 3 + BeautifulSoup + lxml |
| Hosting | Railway |
| Node Version | ≥22 (required by Next.js 16) |

---

## 3. File Structure

```
bacau-scout/
├── docs/
│   ├── ARCHITECTURE.md          ← This file
│   ├── CHANGELOG.md             ← Detailed fix documentation (required per commit)
│   └── DATA_PIPELINE.md         ← Scraping, parsing, data schema docs
├── prisma/
│   ├── schema.prisma            ← Database schema (Scout, Invite, ScoutingReport)
│   └── migrations/              ← All migration history
├── public/
│   └── players.json             ← All player data (21,647 players, ~13MB)
├── scripts/
│   ├── rescrape_all.py          ← ⭐ Full rescrape of all 37 leagues
│   ├── rescrape_romania.py      ← Quick Romanian-only rescrape
│   ├── scraper_complete.py      ← Full scrape with individual profiles
│   └── enrich_data.py           ← Fill missing age/position from profiles
├── src/
│   ├── app/
│   │   ├── layout.tsx           ← Root layout (SessionProvider wraps all pages)
│   │   ├── page.tsx             ← Homepage dashboard (CLIENT component)
│   │   ├── login/page.tsx       ← Login page (PUBLIC)
│   │   ├── register/page.tsx    ← Invite-only registration (PUBLIC)
│   │   ├── admin/page.tsx       ← Admin panel — invite scouts, manage users
│   │   ├── search/page.tsx      ← Player Database (full table view)
│   │   ├── player/[id]/
│   │   │   ├── page.tsx         ← Player detail (SERVER component, reads data directly)
│   │   │   └── not-found.tsx    ← 404 for missing players
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts ← NextAuth endpoints (PUBLIC)
│   │       │   ├── register/route.ts      ← Registration endpoint (PUBLIC)
│   │       │   └── validate-invite/route.ts ← Invite token validation (PUBLIC)
│   │       ├── admin/
│   │       │   ├── invites/route.ts       ← CRUD invites (ADMIN only)
│   │       │   └── scouts/route.ts        ← List scouts (ADMIN only)
│   │       ├── search/route.ts            ← Player search API (AUTH required)
│   │       ├── player/[id]/route.ts       ← Player detail API (AUTH required)
│   │       └── grades/
│   │           ├── route.ts               ← List all grades (AUTH required)
│   │           └── [playerId]/route.ts    ← CRUD grades (AUTH required)
│   ├── components/
│   │   ├── GradingForm.tsx      ← Full scouting report form (19 attributes)
│   │   ├── GradesTable.tsx      ← Dashboard grades table
│   │   ├── PlayerGrading.tsx    ← Grading wrapper on player detail page
│   │   ├── PlayerCard.tsx       ← Player card for grid view
│   │   ├── PlayerList.tsx       ← Grid/list view renderer
│   │   ├── SearchBar.tsx        ← Homepage search (uses /api/search)
│   │   └── FilterPanel.tsx      ← Search filters
│   ├── lib/
│   │   ├── players.ts           ← Player data loading/normalization/search
│   │   ├── grades.ts            ← Grade types, helpers, localStorage + API functions
│   │   ├── prisma.ts            ← Prisma client singleton
│   │   └── auth.ts              ← NextAuth configuration
│   └── middleware.ts            ← Auth middleware (protects all non-public routes)
├── .node-version                ← "22" (required for Railway)
├── .env                         ← Local env vars (NEXTAUTH_URL, DATABASE_URL, NEXTAUTH_SECRET)
├── package.json                 ← Dependencies + engines: { node: ">=22" }
└── railway.toml                 ← Railway build config
```

---

## 4. Authentication & Authorization

### Overview
- **Provider:** NextAuth v4 with credentials (email/password + bcrypt)
- **Sessions:** JWT-based (not database sessions)
- **Roles:** `admin` and `scout`

### Flow
1. User visits any page → middleware checks for JWT token
2. No token → redirected to `/login` (pages) or gets JSON 401 (API routes)
3. Login with email/password → bcrypt compare → JWT issued
4. Registration requires invite token → `/register?token=xxx`

### Middleware (`src/middleware.ts`)

**CRITICAL: Understand this before changing ANY route**

```
Request → middleware.ts
  ├── Public paths (bypass): /login, /register, /api/auth/*
  ├── Static assets (bypass): /_next/*, /favicon.ico, /images/*
  ├── Has valid JWT token → NextResponse.next()
  └── No token:
      ├── /api/* routes → JSON { error: "Unauthorized" } (401)
      └── Page routes → redirect to /login?callbackUrl=...
```

**⚠️ GOTCHA: API routes MUST return JSON errors, never HTML redirects.** If an API route returns HTML and a client tries to `JSON.parse()` it, the app crashes with `SyntaxError: Unexpected token '<'`. This was the root cause of the Feb 5 crash.

### Admin Accounts
- `crypwalk@bacauscout.com` / `BacauScout2026!` (admin)
- `flavius@bacauscout.com` / `BacauScout2026!` (admin)

### Invite System
- Admins create invites at `/admin` → generates `/register?token=xxx` link
- Tokens expire after 7 days
- Each token tied to an email address
- Once used, token is marked `used: true`

---

## 5. Pages & Routes

### ⚠️ Server vs Client Components — READ THIS

| Page | Type | Why It Matters |
|------|------|---------------|
| `/` (Homepage) | **CLIENT** (`'use client'`) | Runs in browser, has session access via `useSession()` |
| `/search` | **CLIENT** | Fetches players.json client-side |
| `/player/[id]` | **SERVER** | Runs on Railway server, NO browser cookies, NO session |
| `/login` | **CLIENT** | Handles sign-in form |
| `/register` | **CLIENT** | Handles registration form |
| `/admin` | **CLIENT** | Admin panel with session check |

**CRITICAL RULE: Server components cannot make authenticated HTTP calls to their own API routes.** They don't have the user's cookies. If a server component needs data, it must import the data function directly (e.g., `findPlayerById()` from `lib/players.ts`), NOT fetch from `/api/player/[id]`.

### Homepage (`/`) — `src/app/page.tsx`

**Type:** Client component
**Data source:** `getAllGradesAsync()` from `lib/grades.ts` → fetches `/api/grades` (database)
**Auth:** Uses `useSession()` hook for admin button visibility
**Features:**
- Shared dashboard — all scouts see all reports from the database
- Filter by verdict, position, search by name
- Sort by name, ability, potential, date
- Summary stats: total reports, sign/observe/monitor counts
- ⚙️ Admin button (visible only to admin role)
- "+ Scout New Player" button → links to `/search`

**Dashboard columns:** POS | Player | Club | Verdict | Ability | Potential | Est Salary | Scout | Date

### Player Database (`/search`) — `src/app/search/page.tsx`

**Type:** Client component
**Data source:** Client-side fetch of `/players.json` (static file)
**Features:**
- Full table with 21,647 players
- Search by name (diacritics-stripped) or Transfermarkt URL
- Filter by position, league, age range
- Sort by name, age, value, goals, matches
- Pagination (50 per page)

### Player Detail (`/player/[id]`) — `src/app/player/[id]/page.tsx`

**Type:** SERVER component
**Data source:** `findPlayerById(id)` imported directly from `lib/players.ts`
**⚠️ Does NOT fetch from API — reads data in-process from memory/filesystem**
**Features:**
- Hero card with player info, position badge, market value
- Career overview (appearances, goals, assists, minutes, ratios)
- Season-by-season stats table
- Scouting report form (GradingForm component)
- Link to Transfermarkt profile

### Admin (`/admin`) — `src/app/admin/page.tsx`

**Type:** Client component
**Auth:** Checks `session.user.role === 'admin'`, redirects non-admins
**Features:**
- Invite form: enter email + role → generates invite link
- Copy invite link button
- All Scouts table (name, email, role, joined date)
- Pending Invites list (email, role, expiry)

---

## 6. Components

### GradingForm (`src/components/GradingForm.tsx`)

The main scouting report form. Used on player detail pages.

**Categories & Attributes (19 total):**

| Category | Attributes | Rating |
|----------|-----------|--------|
| Physical (4) | Strength, Speed, Agility, Coordination | 1-5 each |
| Technique (9) | Control, Short passes, Long passes, Aerial, Crossing, Finishing, Dribbling, 1v1 Offensive, 1v1 Defensive | 1-5 each |
| Tactic (6) | Positioning, Transition, Decisions, Anticipations, Duels, Set pieces | 1-5 each |

**Overall Assessment (prominent, bordered box before verdict):**
- ABILITY (1-5) — overall ability score
- POTENTIAL (1-8) — overall potential score (Romanian league levels)

**Additional fields:**
- Scout Name — auto-filled from session (`session.user.name`), read-only
- Status: FM, U23, LOAN, WATCH
- Scouting Level: Basic, Impressive, Data only
- Scouting Tags: 3 max from 65+ options across 6 categories
- Verdict: Sign, Observe, Monitor, Not a priority, Out of reach, Discard
- Role (text), Conclusion (text), Notes (text)
- Transfer Fee, Salary (text)

**UI pattern:** Compact FM-style badge with ▲▼ arrows for each rating.

**Save behavior:** Dual write — saves to localStorage AND POST to `/api/grades/{playerId}`

---

## 7. Data Libraries

### `src/lib/players.ts` — Player Data (Server-Side)

**Core data layer.** Loads and normalizes `public/players.json`.

**Key functions:**
- `loadPlayers()` — Loads JSON, normalizes all players, caches in memory. Returns `NormalizedPlayer[]`
- `findPlayerById(id)` — O(1) lookup by player ID. Returns `PlayerDetail` with full bio + career stats
- `normalizePlayer(raw)` — Converts raw JSON to normalized format
- `parseMarketValue(str)` — Converts "€500k" → 500000
- `stripDiacritics(str)` — Removes accents for search

**Caching:** Players loaded once, cached in module-level variables. Server restart clears cache.

**⚠️ This is a server-only module (uses `fs`). Cannot be imported in client components.**

### `src/lib/grades.ts` — Grades & Types (Client-Side)

**Marked `'use client'`.** Contains all grade types, constants, and CRUD functions.

**Key functions:**
- `getAllGradesAsync()` — Fetches from `/api/grades` (database, cross-device)
- `getGradeAsync(playerId)` — Fetches single grade from database
- `saveGrade(grade)` — Saves to localStorage AND database (dual write)
- `getAllGrades()` — Legacy: reads from localStorage only

**Key constants:**
- `ATTRIBUTE_CATEGORIES` — Physical/Technique/Tactic with attribute definitions
- `SCOUTING_TAG_CATEGORIES` — 6 categories, 65+ tags
- `VERDICT_OPTIONS` — 6 verdicts with colors
- `POTENTIAL_LABELS` — 1-8 scale descriptions (Liga 3a → Superliga playoff)
- `ABILITY_LABELS` — 1-5 scale descriptions

### `src/lib/prisma.ts` — Database Client

Prisma client singleton (prevents multiple instances in dev hot reload).

---

## 8. API Endpoints

### Authentication (PUBLIC — no auth required)

| Method | Path | Purpose |
|--------|------|---------|
| `*` | `/api/auth/*` | NextAuth endpoints (login, session, etc.) |
| `POST` | `/api/auth/register` | Create account with invite token |
| `POST` | `/api/auth/validate-invite` | Check if invite token is valid |

### Admin (ADMIN role required)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/admin/scouts` | List all registered scouts |
| `GET` | `/api/admin/invites` | List all invites |
| `POST` | `/api/admin/invites` | Create new invite (email + role → token) |

### Player Data (AUTH required)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/search?q=...` | Search players by name or TM URL |
| `GET` | `/api/player/{id}` | Get full player detail by ID |

**Note:** `/api/player/{id}` exists but the player detail page does NOT use it (uses direct import instead). The API route is still available for other clients.

### Grades (AUTH required)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/grades` | List ALL scouting reports (dashboard) |
| `GET` | `/api/grades/{playerId}` | Get single grade |
| `POST` | `/api/grades/{playerId}` | Create/update grade (upsert) |
| `DELETE` | `/api/grades/{playerId}` | Delete grade |

**GET /api/grades backfill:** If a grade has null `playerName`/`position`/`club` (saved before those columns were added), the API automatically looks up the data from `players.json` and returns it. No re-save needed.

---

## 9. Database

### Provider
PostgreSQL on Railway (same project as the app)

### Connection
`DATABASE_URL` env var (set in Railway + local `.env`)

### Schema (`prisma/schema.prisma`)

**3 models:**

#### Scout
Registered users. Fields: id, email (unique), password (bcrypt), name, role, timestamps.

#### Invite
Invite tokens for registration. Fields: id, email (unique), role, token (unique), used, timestamps, expiresAt.

#### ScoutingReport
Scouting grades. One per player (unique on `playerId`).

**Fields:**
- `playerId` (unique, indexed) — Transfermarkt player ID
- `playerName`, `position`, `club` — Player info (nullable, backfilled from players.json if missing)
- `ability` (1-5), `potential` (1-8) — Overall scores
- 19 attribute ability fields: `physStrength`, `physSpeed`, ..., `tacSetPieces` (all Int?)
- 19 attribute potential fields: `physStrengthPot`, ..., `tacSetPiecesPot` (all Int?)
- `scoutingTags` (String[]), `verdict`, `role`, `conclusion`, `notes`
- `scoutName`, `status`, `scoutingLevel`, `transferFee`, `salary`
- `report` (1-5 FCB scale, legacy)
- Legacy columns preserved: `ballControl`, `passing`, etc., `recommendation`, `strengths`, `weaknesses`

**Indexes:** `playerId` (unique + indexed), `verdict` (indexed)

### Migrations
- Run locally: `npx prisma migrate dev --name description`
- Railway auto-runs migrations on build via `prisma generate`
- For schema-only push: `npx prisma db push`

---

## 10. Grading System

### Ability Scale (1-5) — Per Attribute

| Score | Label |
|-------|-------|
| 1 | Well below standard |
| 2 | Below standard |
| 3 | At standard |
| 4 | Above standard |
| 5 | Well above standard |

### Potential Scale (1-8) — Overall Only

| Score | Level |
|-------|-------|
| 1 | Liga 3a Player |
| 2 | Relegation Player |
| 3 | Mid-table Player (playout) |
| 4 | Play-off player |
| 5 | Promotion/championship player |
| 6 | Superliga Player (Playout/Relegation) |
| 7 | Superliga Midtable player |
| 8 | Superliga playoff player |

### Verdicts (6 options)
- **Sign** (green) — Acquire
- **Observe** (blue) — Watch closely
- **Monitor** (yellow) — Keep on radar
- **Not a priority** (gray) — Low interest
- **Out of reach** (red) — Too expensive/unrealistic
- **Discard** (dark red) — Not suitable

### Design History
Went through 3 iterations in one session (Feb 5):
1. Single column attributes → Crypwalk asked for dual columns
2. Dual columns (ability + potential per attribute) → Flavius said too much
3. **Final: Single ability badge per attribute + overall Ability/Potential scores**

**Lesson: Always start minimal. Let users request complexity.**

---

## 11. Scraper Scripts

### Active Scripts

| Script | Purpose | Speed | When to Use |
|--------|---------|-------|-------------|
| `rescrape_all.py` | ⭐ Fresh rosters for ALL 37 leagues | ~15 min | Monthly + transfer windows |
| `rescrape_romania.py` | Fresh RO1+RO2 rosters only | ~5 min | Quick Romanian update |
| `scraper_complete.py` | Full scrape with profiles + stats | ~10+ hours | Major data refresh |
| `enrich_data.py` | Fill missing age/position from profiles | ~3 hours | After gaps found |

### Key Design Rules
1. **NEVER hardcode `saison_id`** — Omit it (TM defaults to current) or use `get_current_season()`
2. **Checkpoint/resume** — `rescrape_all.py` saves to `rescrape_progress.json`
3. **Merge strategy** — New data merges with existing (preserves enriched fields)
4. **Rate limiting** — 1.2-2.5s between requests
5. **League codes change** — If 0 teams or 302 redirect, the code changed. Check DATA_PIPELINE.md.

---

## 12. Deployment

### Infrastructure
- **Hosting:** Railway
- **Database:** PostgreSQL on Railway (same project)
- **Domain:** bacau-scout-production.up.railway.app
- **Port:** 8080 (Railway default, NOT 3000)

### Deploy Process
```bash
cd projects/bacau-scout
npx next build           # Verify build passes locally
git add -A && git commit -m "description"
git push origin master
echo "y" | railway up    # Git push does NOT auto-deploy
```

### Environment Variables (Railway)
| Var | Value |
|-----|-------|
| `DATABASE_URL` | postgresql://... (auto-set by Railway PostgreSQL addon) |
| `NEXTAUTH_URL` | https://bacau-scout-production.up.railway.app |
| `NEXTAUTH_SECRET` | (random string) |

### Requirements
- Node ≥22 (`.node-version` + `package.json` engines)
- `railway.toml` with build config

---

## 13. Common Pitfalls & Gotchas

### ⚠️ CRITICAL — Read Before Making Changes

#### 1. Server Components Cannot Call Authenticated APIs
**What:** Server components (like `/player/[id]/page.tsx`) run on the Railway server. They do NOT have the user's browser cookies/JWT.
**Impact:** If a server component fetches `/api/grades` or any auth-protected API, the middleware returns 401 (or used to redirect to login HTML, causing JSON parse crash).
**Rule:** Server components that need data must import functions directly (e.g., `findPlayerById()`), NOT make HTTP calls to their own API routes.
**Affected pages:** `/player/[id]` (server component)

#### 2. API Routes Must Return JSON Errors, Not HTML
**What:** The middleware must return `NextResponse.json({ error }, { status: 401 })` for `/api/*` routes, never redirect to `/login`.
**Impact:** Clients calling APIs expect JSON. An HTML redirect causes `SyntaxError: Unexpected token '<', "<!DOCTYPE"... is not valid JSON` — crashes the app.
**Where:** `src/middleware.ts`

#### 3. Railway Runs on Port 8080, Not 3000
**What:** Next.js defaults to port 3000 locally, but Railway sets PORT=8080.
**Impact:** Any hardcoded `localhost:3000` reference in server-side code fails on Railway.
**Rule:** Never hardcode ports. Use relative URLs in client code. Use direct imports in server code.

#### 4. Railway Requires Manual Deploy
**What:** `git push origin master` pushes code but does NOT deploy.
**Rule:** Always run `echo "y" | railway up` after pushing.

#### 5. Never Hardcode Dates/Seasons
**What:** Scraper season IDs must be dynamic. My training data makes old years feel "current."
**Rule:** Always use `get_current_season()` or derive from `datetime.now()`.

#### 6. `players.ts` is Server-Only
**What:** Uses Node.js `fs` module to read `players.json`.
**Impact:** Cannot be imported in any file marked `'use client'`.
**Rule:** Client components access player data via API routes or static file fetch.

#### 7. Prisma Client Singleton
**What:** Creating `new PrismaClient()` in every API route file creates connection leaks in dev.
**Rule:** Import from `lib/prisma.ts` for the singleton. (Currently some routes create their own — should be migrated.)

#### 8. localStorage vs Database Grades
**What:** `grades.ts` has both `getAllGrades()` (localStorage) and `getAllGradesAsync()` (database).
**Dashboard uses:** `getAllGradesAsync()` (database — shared across all scouts)
**GradingForm uses:** `saveGrade()` (dual write to both localStorage and database)
**Rule:** For reading, always prefer `getAllGradesAsync()` (database). localStorage is legacy.

#### 9. Missing Player Info in Old Grades
**What:** Grades saved before Feb 5 don't have `playerName`/`position`/`club` in the DB.
**Handled by:** GET `/api/grades` backfills from `players.json` on the fly.
**Long-term:** Old grades get updated when re-saved.

---

## 14. Known Issues & TODOs

### Active Issues
- [ ] Some API routes create `new PrismaClient()` instead of using singleton
- [ ] localStorage dual-write in `saveGrade()` is redundant now that dashboard reads from DB
- [ ] No password change/reset flow for scouts
- [ ] RO3 (Liga 3) broken on Transfermarkt (302 redirect)
- [ ] Spain Segunda RFEF available but not scraped (5 groups, too many low-tier players)

### Future Work
- [ ] Remove localStorage grade reads entirely (keep write as offline fallback only)
- [ ] Add scout filtering on dashboard (show only my reports vs all)
- [ ] Photo URLs — only 7% coverage
- [ ] Position name normalization (both "Centre-Back" and "Defender - Centre-Back" exist)
- [ ] Scheduled rescrapes (cron job for monthly Romanian data refresh)

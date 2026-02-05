# Bacau Scout — Full Architecture Documentation

Last updated: 2026-02-05

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [File Structure](#3-file-structure)
4. [Pages & Routes](#4-pages--routes)
5. [Components](#5-components)
6. [Data Libraries](#6-data-libraries)
7. [API Endpoints](#7-api-endpoints)
8. [Database (Prisma/PostgreSQL)](#8-database)
9. [Grading System](#9-grading-system)
10. [Scraper Scripts](#10-scraper-scripts)
11. [Deployment](#11-deployment)
12. [Known Issues & TODOs](#12-known-issues--todos)

---

## 1. Project Overview

Bacau Scout is a football scouting tool for evaluating players across 37 leagues. 15 scouts use it to search players, view profiles, and submit scouting reports with a 13-metric grading system (1-8 scale based on Romanian league tiers).

**Live URL:** https://bacau-scout-production.up.railway.app  
**Repo:** https://github.com/cryptikhunterz/bacau-scout

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
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
│   └── DATA_PIPELINE.md         ← Scraping, parsing, data schema docs
├── prisma/
│   └── schema.prisma            ← Database schema (ScoutingReport model)
├── public/
│   └── players.json             ← All player data (22K+ players, ~13MB)
├── scripts/
│   ├── rescrape_all.py          ← ⭐ Full rescrape of all 37 leagues
│   ├── rescrape_romania.py      ← Quick Romanian-only rescrape
│   ├── scraper_complete.py      ← Full scrape with individual profiles
│   ├── enrich_data.py           ← Fill missing age/position from profiles
│   └── ... (legacy scripts)
├── src/
│   ├── app/
│   │   ├── page.tsx             ← Homepage (scouting reports dashboard)
│   │   ├── layout.tsx           ← Root layout (dark theme)
│   │   ├── search/
│   │   │   └── page.tsx         ← Player Database (full table view)
│   │   ├── player/[id]/
│   │   │   ├── page.tsx         ← Player detail/profile page
│   │   │   └── not-found.tsx    ← 404 for missing players
│   │   └── api/
│   │       ├── search/route.ts  ← Search API (server-side)
│   │       ├── player/[id]/route.ts ← Player detail API
│   │       └── grades/
│   │           ├── route.ts     ← List all grades
│   │           └── [playerId]/route.ts ← CRUD for individual grades
│   ├── components/
│   │   ├── SearchBar.tsx        ← Homepage search (uses /api/search)
│   │   ├── PlayerCard.tsx       ← Player card for grid view
│   │   ├── PlayerList.tsx       ← Grid/list view renderer
│   │   ├── FilterPanel.tsx      ← Search filters (position, club, age, value)
│   │   ├── GradingForm.tsx      ← 13-metric grading form (1-8 scale)
│   │   ├── GradesTable.tsx      ← Table of all scouting reports
│   │   ├── GradesFilters.tsx    ← Filter controls for grades table
│   │   └── PlayerGrading.tsx    ← Grading section on player detail page
│   ├── lib/
│   │   ├── players.ts           ← Player data loading, normalization, search
│   │   ├── grades.ts            ← Grade CRUD (localStorage + API)
│   │   ├── prisma.ts            ← Prisma client singleton
│   │   └── supabase.ts          ← Supabase client (legacy, unused)
│   └── types/
│       └── player.ts            ← Shared TypeScript types
├── .node-version                ← Node 22 (required for Railway)
├── package.json                 ← Dependencies + engines
├── railway.toml                 ← Railway build config
└── prisma.config.ts             ← Prisma config
```

---

## 4. Pages & Routes

### Homepage (`/`) — `src/app/page.tsx`

**Purpose:** Scouting reports dashboard  
**Data source:** `getAllGrades()` from `lib/grades.ts` (localStorage)  
**Features:**
- Shows all graded players with their scores
- Filter by recommendation (Sign/Monitor/Discard)
- Filter by position, sort by various metrics
- Summary stats: total reports, sign/monitor/discard counts
- Links to Player Database and individual player pages

**⚠️ Known issue:** Uses `getAllGrades()` (localStorage) instead of `getAllGradesAsync()` (database). Grades don't sync across devices.

### Player Database (`/search`) — `src/app/search/page.tsx`

**Purpose:** Browse and search all 22K+ players  
**Data source:** Client-side fetch of `/players.json`  
**Features:**
- Full table with columns: POS, Name, Age, Club, League, Value, MP, Gls, Ast, G+A
- **Search by name** (case-insensitive, partial match)
- **Search by Transfermarkt URL** (any TLD — detects `transfermarkt` + `spieler` in query, extracts player ID)
- Filter by position (dropdown), league (dropdown), age range
- Sort by name, age, value, goals, matches (asc/desc toggle)
- Pagination (50 per page)
- Color-coded position badges (GK=yellow, CB=blue, CM=green, CF=red, etc.)
- Color-coded age badges (≤21 green → >32 red)
- Market value in green

**URL search detection logic:**
```typescript
if (search.includes('transfermarkt') && search.includes('spieler')) {
  const match = search.match(/spieler\/(\d+)/);
  if (match) return p.player_id === match[1];
}
```

### Player Detail (`/player/[id]`) — `src/app/player/[id]/page.tsx`

**Purpose:** Full player profile + grading form  
**Data source:** Server-side via `findPlayerById()` from `lib/players.ts`  
**Features:**
- Hero card with player photo, name, club, league, nationality
- Bio details: DOB, height, foot, citizenship, contract
- Market value display
- Career stats summary (appearances, goals, assists, minutes)
- Season-by-season stats table
- Scouting report form (GradingForm component)
- Link to Transfermarkt profile

---

## 5. Components

### SearchBar (`src/components/SearchBar.tsx`)

**Used on:** Homepage  
**Calls:** `/api/search` (server-side)  
**Features:**
- Debounced input (300ms)
- Supports name search AND Transfermarkt URL search (via API)
- Shows results in grid or list view
- Filter panel appears after first search
- Loading skeleton cards while fetching

### GradingForm (`src/components/GradingForm.tsx`)

**Used on:** Player detail page  
**Features:**
- 13 metrics across 4 categories, each rated 1-8
- Rating scale based on Romanian league levels:
  - 1 = Liga 3a level
  - 4 = Liga 2 average
  - 6 = Superliga starter
  - 8 = Superliga playoff / international
- Status selector: FM, U23, LOAN, WATCH
- Recommendation: Sign, Monitor, Discard
- Scouting level: Basic, Impressive, Data only
- Strengths/weaknesses tags
- Free-text notes
- Transfer fee and salary fields
- Saves to localStorage AND database (dual write)

### GradesTable (`src/components/GradesTable.tsx`)

**Used on:** Homepage  
**Features:**
- Table of all scouting reports
- Shows player name, position, club, recommendation, average score
- Color-coded recommendation badges
- Sortable columns
- Click to open player detail

### PlayerCard (`src/components/PlayerCard.tsx`)

**Used on:** Search results (grid view)  
**Features:**
- Compact card with name, position, club, nationality flag
- Market value, age, stats (G, A, G+A)
- Click to open player detail
- Skeleton loading state

### FilterPanel (`src/components/FilterPanel.tsx`)

**Used on:** Homepage search results  
**Features:**
- Position dropdown
- Club text filter
- Age range (min/max)
- Market value range (min/max)

---

## 6. Data Libraries

### `src/lib/players.ts`

**Core data layer.** Loads and normalizes `public/players.json`.

**Key functions:**
- `loadPlayers()` — Loads JSON, normalizes all players, caches in memory. Returns `NormalizedPlayer[]`
- `normalizePlayer(raw)` — Converts raw JSON record to normalized format. Handles both new format (`player_id`) and legacy format (`Player` array)
- `findPlayerById(id)` — O(1) lookup by player ID. Returns `PlayerDetail` with full bio + career stats
- `parseMarketValue(str)` — Converts "€500k" → 500000, "€1.2m" → 1200000
- `extractPlayerIdFromUrl(url)` — Extracts ID from `/spieler/12345` pattern
- `stripDiacritics(str)` — Removes accents for search (Târnovanu → tarnovanu)

**Caching:** Players loaded once on first request, cached in module-level variables. Server restarts clear cache.

**Types:**
- `RawPlayer` — Raw JSON format (many optional fields, supports legacy formats)
- `NormalizedPlayer` — Cleaned format for search (includes pre-computed `nameSearch`, `marketValueNum`, `ageNum`)
- `PlayerDetail` — Full detail for profile page (bio, career stats, season stats)

### `src/lib/grades.ts`

**Grading data layer.** Dual storage: localStorage (client) + PostgreSQL (server).

**Key functions:**
- `getGrade(playerId)` — Get grade from localStorage
- `saveGrade(grade)` — Save to localStorage AND POST to `/api/grades/{playerId}`
- `getAllGrades()` — Get all grades from localStorage (sync, client-only)
- `getAllGradesAsync()` — Get all grades from database (async, cross-device)
- `deleteGrade(playerId)` — Delete from localStorage AND database

**Types:**
- `PlayerGrade` — Full grade with 13 metrics, status, recommendation, tags, notes
- `MetricRating` — 1-8 integer
- `Status` — "FM" | "U23" | "LOAN" | "WATCH"
- `Recommendation` — "Sign" | "Monitor" | "Discard"

**⚠️ Homepage uses `getAllGrades()` (localStorage). Should use `getAllGradesAsync()` for cross-device sync.**

### `src/lib/prisma.ts`

Prisma client singleton (prevents multiple instances in dev hot reload).

---

## 7. API Endpoints

### `GET /api/search?q={query}&position=...&club=...&minAge=...&maxAge=...`

**Purpose:** Server-side player search  
**Used by:** Homepage SearchBar component

**Search modes:**
1. **Transfermarkt URL** — If query contains `transfermarkt` AND `spieler`, extracts player ID and returns exact match
2. **Name search** — Strips diacritics, partial match on name. Applies filters after name match.

**Filters (all optional, AND-ed together):**
- `position` — exact match (case-insensitive)
- `club` — partial match (case-insensitive)
- `minAge` / `maxAge` — integer range on pre-computed `ageNum`
- `minValue` / `maxValue` — integer range on pre-computed `marketValueNum`

**Returns:** Array of `SearchPlayer` objects

### `GET /api/player/{id}`

**Purpose:** Get player detail by Transfermarkt ID  
**Used by:** Player detail page (server component)  
**Returns:** Full player detail with bio, career stats, season stats  
**Logging:** `[Player] id="{id}" found={true|false} time={ms}ms`

### `GET /api/grades`

**Purpose:** List all scouting reports from database  
**Returns:** Array of `ScoutingReport` objects (Prisma model)

### `GET /api/grades/{playerId}`

**Purpose:** Get single scouting report  
**Returns:** `ScoutingReport` or 404

### `PUT /api/grades/{playerId}`

**Purpose:** Create or update scouting report  
**Body:** Full grade data (13 metrics, recommendation, notes, etc.)  
**Behavior:** Upsert — creates if new, updates if exists

### `DELETE /api/grades/{playerId}`

**Purpose:** Delete scouting report  
**Returns:** 200 on success, 404 if not found

---

## 8. Database

### Provider
PostgreSQL on Railway (auto-provisioned)

### Connection
`DATABASE_URL` environment variable (set in Railway dashboard)

### Schema (`prisma/schema.prisma`)

Single model: `ScoutingReport`

```prisma
model ScoutingReport {
  id                String   @id @default(cuid())
  playerId          String   @unique
  
  // Technical (1-8)
  ballControl       Int?
  passing           Int?
  dribbling         Int?
  finishing         Int?
  
  // Athletic (1-8)
  pace              Int?
  stamina           Int?
  strength          Int?
  
  // Attacking (1-8)
  positioning       Int?
  movement          Int?
  creativity        Int?
  
  // Tactical (1-8)
  decisionMaking    Int?
  workRate          Int?
  discipline        Int?
  
  recommendation    String?    // "sign" | "monitor" | "discard"
  strengths         String[]
  weaknesses        String[]
  notes             String?
  scoutName         String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**Indexes:** `playerId` (unique + indexed), `recommendation` (indexed)

### Migrations
Run `npx prisma migrate deploy` on Railway or `npx prisma db push` for quick sync.

---

## 9. Grading System

### Rating Scale (1-8)

| Score | Level | Description |
|-------|-------|-------------|
| 1 | Liga 3a | Third division level |
| 2 | Liga 3a top | Top of third division |
| 3 | Liga 2 bottom | Second division fringe |
| 4 | Liga 2 average | Solid second division |
| 5 | Liga 2 top / Superliga fringe | Promotion quality |
| 6 | Superliga starter | First division regular |
| 7 | Superliga top | Top of first division |
| 8 | Superliga playoff / international | Elite domestic level |

### 13 Metrics (4 Categories)

**I. Technical Proficiency:**
1. Dribbling & Ball Control
2. 1v1 Dribbling
3. Passing Range & Creation
4. Crossing & Delivery

**II. Athletic & Physical:**
5. Acceleration & Pace
6. Work Rate & Stamina
7. Physical Dueling & Aerial

**III. Attacking Output:**
8. Goal Contribution
9. Carrying & Progression
10. Finishing & Shot Placement

**IV. Tactical IQ:**
11. Positional Intelligence
12. Defensive Pressing Intensity
13. 1v1 Duels

### Recommendations
- **Sign** — Player worth acquiring
- **Monitor** — Keep watching, not ready to commit
- **Discard** — Not suitable

### Status Tags
- **FM** — First team material
- **U23** — Youth/development prospect
- **LOAN** — Loan candidate
- **WATCH** — Watchlist

---

## 10. Scraper Scripts

### Active Scripts (use these)

| Script | Purpose | Speed | When to Use |
|--------|---------|-------|-------------|
| `rescrape_all.py` | ⭐ Fresh rosters for ALL 37 leagues | ~15 min | Monthly refresh or after transfer window |
| `rescrape_romania.py` | Fresh RO1+RO2 rosters only | ~5 min | Quick Romanian data update |
| `scraper_complete.py` | Full scrape with individual profiles + stats | ~10+ hours | Initial database build or major refresh |
| `enrich_data.py` | Fill missing age/position from profiles | ~3 hours | After bulk scrape shows data gaps |

### Legacy Scripts (don't use unless needed)

| Script | Notes |
|--------|-------|
| `scraper.py` | Original market value page scraper |
| `scraper_full_rosters.py` | Older roster scraper |
| `scraper_details.py` | Profile detail scraper |
| `scrape_fast.py` | Quick scrape variant |
| `scrape_profiles.py` | Career stats scraper |
| `scrape_everything.py` | All-in-one (superseded by scraper_complete.py) |
| `fix_positions.py` | One-time position fix |
| `scrape_positions_*.py` | Position-only scrapers |
| `enrich_fast.py` | Fast enrichment variant |

### Key Design Decisions

1. **No `saison_id` in URLs** — Omitting it makes Transfermarkt default to current season automatically
2. **Checkpoint/resume** — `rescrape_all.py` saves progress after each league to `rescrape_progress.json`
3. **Merge strategy** — Rescrape scripts merge new data with existing enriched data (keeps career stats, height, foot, etc. from old profiles)
4. **Rate limiting** — 1.2-2.5s between team pages, 2-3.5s between individual profiles
5. **League codes change** — TM restructures leagues (splits into groups, renames). If 0 teams returned, code changed. See DATA_PIPELINE.md for current codes.

### Current League Codes (37 leagues)

**Romania:** RO1, RO2  
**Balkans:** KR1, KR2, SER1, SER2, ALB1, KO1, MNE1, SL1, SL2, BOS1  
**Italy:** IT3A, IT3B, IT3C  
**Portugal:** PO2, PT3A  
**France:** FR3, CN2A, CN2B, CN2C, CN2D  
**Spain:** ES3A, ES3B  
**Belgium:** BE2  
**Poland:** PL1, PL2  
**Austria:** A1, A2  
**Czech/Slovakia:** TS1, TS2, SLO1  
**Netherlands:** NL2  
**Nordics/Baltics:** FI1, LI1, EST1  
**USA:** MNP3  

---

## 11. Deployment

### Infrastructure

- **Hosting:** Railway (auto-builds from `railway up`)
- **Database:** PostgreSQL on Railway (same project)
- **Domain:** bacau-scout-production.up.railway.app
- **Build:** `prisma generate && next build`
- **Start:** `next start` (port 8080)

### Requirements

- Node ≥22 (set in `.node-version` + `package.json` engines)
- `DATABASE_URL` env var for PostgreSQL
- `railway.toml` with `NO_CACHE = true` for clean builds

### Deploy Process

1. Make changes
2. `git add -A && git commit -m "description"`
3. `git push origin master`
4. `echo "y" | railway up` (git push alone does NOT auto-deploy)
5. Wait ~2 min for build
6. Verify: `curl -s "https://bacau-scout-production.up.railway.app/players.json" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))"`

### Common Build Failures

| Error | Cause | Fix |
|-------|-------|-----|
| `Node.js 18.x ... version ">=20.9.0" is required` | Railway using wrong Node | Check `.node-version` = `22` |
| `prisma generate` fails | Missing DATABASE_URL | Set env var in Railway dashboard |
| Old data after deploy | CDN cache | Hard refresh (Cmd+Shift+R) |
| Deploy shows SUCCESS but old data | Build used cached layers | Add `NO_CACHE=true` in railway.toml |

---

## 12. Known Issues & TODOs

### Bugs
- [ ] **Homepage uses localStorage for grades** — `getAllGrades()` should be `getAllGradesAsync()` for cross-device sync
- [ ] **RO3 (Liga 3) unavailable** — Transfermarkt redirects, code may have changed
- [ ] **Italy Serie B (IT2) not in scraper league list** — Was in old data from a different scraper run, recovered via merge but will be lost on next full rescrape

### TODOs
- [ ] Add IT2 (Serie B) to league list in `rescrape_all.py`
- [ ] Position name normalization — Both "Centre-Back" and "Defender - Centre-Back" exist in data
- [ ] Deduplicate players — Some players appear in both old (recovered) and new data if they transferred between leagues
- [ ] Photo URLs — Only 7% coverage, need to scrape from profiles
- [ ] Season stats — Only available for players scraped with `scraper_complete.py`

### Maintenance Schedule
- **Every transfer window** (Jan, Aug): Run `rescrape_all.py`
- **Monthly:** Run `rescrape_romania.py` for scouts' primary leagues
- **Quarterly:** Consider full `scraper_complete.py` run for career stats refresh

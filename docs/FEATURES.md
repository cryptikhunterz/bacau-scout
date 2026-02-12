# Bacau Scout — Feature Documentation

## Scouting Report System

### How It Works

1. **Search** (`/search`) — Scout searches for a player by name or Transfermarkt URL
2. **Player Profile** (`/player/[id]`) — View player stats + grading form to submit a report
3. **Dashboard** (`/`) — See all submitted reports in a table
4. **Report View** (`/report/[playerId]`) — Read-only view of a submitted report (full breakdown)

### Grading Form

Located in `src/components/GradingForm.tsx`, used on the player profile page.

**Attributes rated 1-5 (ability only, single column):**

| Category | Attributes |
|----------|-----------|
| I. Physical (4) | Strength, Speed, Agility, Coordination |
| II. Technique (9) | Control, Short passes, Long passes, Aerial, Crossing, Finishing, Dribbling, 1v1 Offense, 1v1 Defense |
| III. Tactic (6) | Positioning, Transition, Decisions, Anticipations, Duels, Set pieces |

**Overall Scores (standalone, set by scout):**
- **Ability** (1-5) — current level
- **Potential** (1-8) — projected ceiling using Romanian league scale:
  - 1=Liga 3a, 2=Relegation, 3=Mid-table, 4=Play-off, 5=Promotion, 6=Superliga Playout, 7=Superliga Midtable, 8=Superliga Playoff

**Additional Fields:**
- Verdict: Sign, Monitor, Not a priority, Out of reach
- Scouting Tags (3 max, from 65+ categorized options)
- Role (free text, e.g. "Box-to-box midfielder")
- Conclusion (free text)
- Notes (free text)
- Est. Salary, Transfer Fee (optional)
- Scout name (auto-filled from session)

### Data Flow

```
Scout fills form → saveGrade() → localStorage (immediate)
                                → saveGradeAsync() → POST /api/grades/[playerId] → PostgreSQL (async)

Dashboard loads  → getAllGradesAsync() → GET /api/grades → PostgreSQL → all reports
```

**Dual-write:** Grades save to localStorage first (instant UX), then async to the database. The dashboard reads from the DB so all scouts see shared data.

### Report View (Read-Only)

Route: `/report/[playerId]`
File: `src/app/report/[playerId]/page.tsx`

Displays the full scouting report from the database. Accessed by clicking a player name on the dashboard. Shows:
- Player name, position, club
- Scout name and date
- Verdict badge
- Overall Ability + Potential scores
- All 19 attribute ratings (ability only, single column)
- Scouting tags
- Role, Conclusion, Notes
- Est. Salary, Transfer Fee

Links to the player profile page for editing or creating a new report.

**Important:** This is read-only. It does NOT modify any data.

### Known Limitations

1. **One report per player** — DB constraint `@@unique([playerId])`. If two scouts grade the same player, the second save overwrites the first. Multi-scout support planned.
2. **localStorage dual-write** — Homepage still uses localStorage for some reads. Should fully switch to DB reads.
3. **No password change flow** — Scouts can't change their own passwords yet.

---

## Player Data

### Source
Players are stored in `public/players.json` (flat JSON file, ~21,648 players).
Loaded into memory at startup via `src/lib/players.ts`.

### On-Demand Player Adds
Players not in the regular scrape pipeline (e.g. lower-tier leagues) can be manually added to `players.json` and redeployed. A proper admin UI for on-demand imports is planned.

### Data Fields Per Player
- `player_id` — Transfermarkt ID (unique)
- `name`, `position`, `age`, `club`, `club_id`
- `league`, `league_code`
- `market_value`, `nationality`, `date_of_birth`
- `height`, `foot`, `contract_expires`, `shirt_number`
- `appearances`, `goals`, `assists`
- `career_stats` — total + per-season breakdown
- `profile_url`, `photo_url`
- `scraped_at` — timestamp of last scrape

---

## Authentication

- NextAuth v4 with credentials provider (bcrypt)
- JWT sessions
- Login: `/login`
- Register: `/register?token=xxx` (invite-only via admin panel)
- Admin panel: `/admin` — manage scouts, create invites
- Middleware protects all routes → JSON 401 for API, redirect for pages

---

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/grades` | GET | ✅ | Fetch all scouting reports |
| `/api/grades/[playerId]` | GET | ✅ | Fetch single report |
| `/api/grades/[playerId]` | POST | ✅ | Create/update report (upsert) |
| `/api/grades/[playerId]` | DELETE | ✅ | Delete report |
| `/api/search?q=` | GET | ✅ | Search players by name or TM URL |
| `/api/player/[id]` | GET | ✅ | Get full player details |
| `/api/auth/*` | * | ❌ | NextAuth routes (public) |
| `/api/admin/scouts` | GET | ✅ Admin | List scouts |
| `/api/admin/invites` | POST | ✅ Admin | Create invite token |

All API routes log activity to Railway with `[Grades GET/POST/DELETE]` prefixes for monitoring.

---

## Deployment

- **Platform:** Railway
- **URL:** https://bacau-scout-production.up.railway.app
- **Deploy command:** `cd projects/bacau-scout && echo "y" | railway up`
- **Node version:** ≥22 (required by Next.js 16)
- **Git push does NOT auto-deploy** — must use `railway up`

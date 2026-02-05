# Bacau Scout - Data Pipeline Documentation

## Overview

The data flows through three stages:

```
Transfermarkt → Scraper Scripts → public/players.json → Next.js Frontend
```

All player data lives in a single JSON file (`public/players.json`) that gets baked into the Next.js build. The frontend reads this at runtime for the search page and player profiles.

---

## 1. Data Source: Transfermarkt

### URLs Used

| Data | URL Pattern | Notes |
|------|------------|-------|
| League teams | `/wettbewerb/startseite/wettbewerb/{LEAGUE_CODE}` | Gets list of teams in a league |
| Team roster | `/team/kader/verein/{TEAM_ID}/plus/1` | **Omit `saison_id` — TM defaults to current season** |
| Player profile | `/spieler/profil/spieler/{PLAYER_ID}` | Detailed bio/info |
| Career stats | `/spieler/leistungsdaten/spieler/{PLAYER_ID}/plus/0?saession_id=ges` | Season-by-season stats |

### Season ID

**DO NOT use `saison_id` in roster URLs.** Omitting it makes Transfermarkt default to the current season automatically. This eliminates all hardcoding/calculation issues.

If you ever need a specific season (e.g., for historical data), use `saison_id={YEAR}` where YEAR is the season start year (e.g., 2025 = 2025/26 season). But for current rosters, just leave it out.

### League Codes

Currently scraping 37 leagues. Key codes:

**Romania:**
- `RO1` — Liga 1 (Superliga)  
- `RO2` — Liga 2
- `RO3` — Liga 3 (⚠️ broken on Transfermarkt, returns 302)

**Codes that changed (updated 2026-02-05):**
- Kosovo: `KOS1` → `KO1`
- Slovakia: `SK1` → `SLO1` (Niké Liga)
- Portugal Liga 3: `PO3` → `PT3A`
- France National 2: `FR4` → split into 4 groups: `CN2A`, `CN2B`, `CN2C`, `CN2D`
- Spain Primera RFEF: `ES3` → split into 2 groups: `ES3A`, `ES3B`
- Spain Segunda RFEF: `ES4` → split into 5 groups: `E4G1`-`E4G5` (not currently scraped)

**⚠️ League codes change!** Transfermarkt restructures leagues (splits into groups, renames codes). If a league returns 0 teams or 302 redirect, the code has changed. Check the country's competition page: `transfermarkt.com/wettbewerbe/national/wettbewerbe/{COUNTRY_ID}`

Full list in `scripts/rescrape_all.py` → `LEAGUES` array.

### Rate Limiting

- Transfermarkt returns HTTP 429 when hit too fast
- Scripts use `time.sleep(random.uniform(1.5, 3.5))` between requests
- Individual profile scraping: ~2-3.5s per player
- Roster-only scraping: ~1.5-2.5s per team page
- If rate limited: scripts wait 60s and retry

### Headers

Must include realistic browser `User-Agent` or requests get blocked:
```python
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...',
    'Accept-Language': 'en-US,en;q=0.5',
}
```

---

## 2. Scraper Scripts

### Which Script Does What

| Script | Purpose | Speed | Use When |
|--------|---------|-------|----------|
| `rescrape_romania.py` | **Fresh RO1+RO2 roster data** | ~5 min | Romanian club data is stale |
| `scraper_complete.py` | Full scrape: all leagues + profiles + stats | ~10+ hours | Initial database build |
| `enrich_data.py` | Fill missing age/position from profiles | ~3 hours | After bulk scrape shows gaps |
| `scraper.py` | Basic market value pages only | ~30 min | Quick roster without profiles |
| `scraper_full_rosters.py` | Detailed rosters for all leagues | ~2 hours | Roster refresh without profiles |

### `rescrape_romania.py` (RECOMMENDED for updates)

The fastest way to refresh Romanian data:
1. Loads existing `players.json`
2. Removes all RO1/RO2/RO3 players
3. Scrapes fresh rosters with current `saison_id`
4. Merges new roster data with old enriched data (keeps career stats, etc.)
5. Saves combined result

**Key behavior:** Players no longer on any roster get REMOVED. This is intentional — removes retired, transferred-out, or deceased players.

### Roster Parsing (`get_roster`)

From the team kader page, each player row (`<tr class="odd/even">`) contains:

```
Position: <table class="inline-table"> → 2nd <tr> text
Name:     <a href="/profil/spieler/{ID}"> text
Age:      <td> containing "(25)" pattern inside DOB text  
DOB:      Same cell as age, format "Feb 5, 2000 (25)"
Value:    <td class="rechts hauptlink"> text (e.g., "€500k")
Nation:   <img class="flaggenrahmen" title="Romania">
Shirt:    <div class="rn_nummer"> text
Height:   <td> matching pattern like "1,92 m"
Foot:     <td> with text "left"/"right"/"both"
Photo:    <img class="bilderrahmen-fixed" data-src="...">
```

### Profile Parsing (`get_player_details`)

From individual profile pages:
- **Info table**: `<span class="info-table__content--regular">` = labels, sibling `<span class="info-table__content--bold">` = values
- **⚠️ Known gotcha**: Labels and values must be paired by position. If the DOM structure changes, fields shift and you get wrong data (e.g., height in citizenship field)
- **Full name**: `<h1 class="data-header__headline-wrapper">`
- **Current club**: `<span class="data-header__club"> <a>`

### Nationality Parsing

- Flags come from `<img class="flaggenrahmen" title="...">` 
- **⚠️ Must scope to the roster table row** — page header also has flags
- Deduplicate: same flag can appear twice (once for nationality, once for citizenship)
- Stored as string (single) or array (dual nationality)

---

## 3. Data Schema: `players.json`

Each player object in the JSON array:

```typescript
{
  // === IDENTIFIERS (always present) ===
  player_id: string,          // Transfermarkt player ID (e.g., "568544")
  name: string,               // Display name
  profile_url: string,        // Full TM profile URL
  
  // === ROSTER DATA (from team page) ===
  club: string,               // Current club name
  club_id: string,            // TM club ID  
  league: string,             // League display name
  league_code: string,        // TM league code (RO1, SER1, etc.)
  position: string | null,    // Full position (see Position Values below)
  age: number | null,         // Current age
  market_value: string,       // Formatted value ("€500k", "€1.2m", "-")
  nationality: string | string[], // Single or array for dual nationality
  shirt_number: string,       // Jersey number
  
  // === PROFILE DATA (from individual profile page) ===
  date_of_birth: string,      // "Feb 5, 2000 (25)" or "02/05/2000 (25)"
  height: string,             // "1,92 m"
  foot: string,               // "left" / "right" / "both"
  citizenship: string,        // Country name
  contract_expires: string,   // "30/06/2026"
  photo_url: string,          // Player photo URL
  
  // === CAREER STATS ===
  appearances: number,        // Total career appearances
  goals: number,              // Total career goals
  assists: number,            // Total career assists
  career_stats: {
    total_appearances: number,
    total_goals: number,
    total_assists: number,
    stats_by_season: [{
      season: string,         // "24/25"
      competition: string,    // "Liga 1"
      appearances: number,
      goals: number,
      assists: number
    }]
  },
  
  // === METADATA ===
  scraped_at: string          // ISO timestamp of when this record was scraped
}
```

### Position Values

Transfermarkt returns positions in two formats depending on source:

**From roster pages (short):**
```
Goalkeeper, Centre-Back, Left-Back, Right-Back,
Defensive Midfield, Central Midfield, Attacking Midfield,
Left Winger, Right Winger, Centre-Forward, Second Striker
```

**From profile pages (prefixed):**
```
Defender - Centre-Back, Defender - Left-Back, Defender - Right-Back,
Midfield - Defensive Midfield, Midfield - Central Midfield, 
Midfield - Attacking Midfield, Midfield - Left Midfield,
Attack - Centre-Forward, Attack - Left Winger, Attack - Right Winger
```

**⚠️ The frontend uses `.includes()` matching**, so both formats work:
```typescript
// "Defender - Centre-Back".includes("Centre-Back") → true ✅
// "Centre-Back".includes("Centre-Back") → true ✅
```

**If you change position strings, you MUST update:**
1. `src/app/search/page.tsx` → `positionColors` and `getPositionAbbrev`
2. `src/app/search/page.tsx` → position filter dropdown (auto-populated from data)
3. `src/app/player/[id]/page.tsx` → position display

### Position Abbreviation Map (Frontend)

```
Goalkeeper       → GK    (yellow)
Centre-Back      → CB    (blue)
Left-Back        → LB    (blue)
Right-Back       → RB    (blue)
Defensive Midfield → DM  (dark green)
Central Midfield → CM    (green)
Attacking Midfield → AM  (light green)
Left Winger      → LW    (purple)
Right Winger     → RW    (purple)
Centre-Forward   → CF    (red)
```

---

## 4. Frontend Data Flow

### Search Page (`/search`)

1. Client-side: fetches `/players.json` directly
2. All filtering, sorting, pagination happens in browser
3. Position filter dropdown populated from unique `position` values in data
4. Search matches on `name` (case-insensitive)
5. Age badges: ≤21 green, ≤25 dark green, ≤28 yellow, ≤32 orange, >32 red

### Player Detail Page (`/player/[id]`)

1. Server-side: reads `players.json` from filesystem
2. Looks up by `player_id` using `findPlayerById()` in `src/lib/players.ts`
3. Returns full detail including career stats, bio, etc.

### Search API (`/api/search`)

Server-side search endpoint used by SearchBar component:
- Strips diacritics for matching (Târnovanu → tarnovanu)
- Returns top matches with basic info

### Grades System

- Grades stored in PostgreSQL (Railway)
- `/api/grades` and `/api/grades/[playerId]` endpoints
- Homepage shows graded players
- ⚠️ Homepage currently uses `getAllGrades()` (localStorage) — should use `getAllGradesAsync()` for cross-device sync

---

## 5. Deployment Pipeline

```
Code change → git push origin master → railway up → Build (Node 22+) → Deploy
```

### Critical Notes

- **Railway does NOT auto-deploy from git pushes** — must run `railway up` manually
- **Node version**: Must be ≥22 for Next.js 16 (`.node-version` file + `engines` in `package.json`)
- `players.json` is baked into the build as a static asset in `/public`
- After deploying, the old `players.json` is cached by the CDN — may need hard refresh

### Deploy Checklist

1. Verify `players.json` locally: `python3 -c "import json; d=json.load(open('public/players.json')); print(len(d))"`
2. Check for data issues: missing ages, positions, deceased players
3. `git add -A && git commit -m "description"`
4. `git push origin master`
5. `cd projects/bacau-scout && echo "y" | railway up`
6. Wait ~2 min for build
7. Verify: `curl -s "https://bacau-scout-production.up.railway.app/players.json" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d))"`

---

## 6. Common Issues & Fixes

### Players show wrong clubs
**Cause:** `saison_id` in scraper URL is set to previous year  
**Fix:** Update `saison_id` to current season start year (2025 for 2025/26)

### Positions show "?" in UI
**Cause:** Position is `null` in data, or position string doesn't match any key in `positionColors`  
**Fix:** Run enrichment script, or check if position format changed on Transfermarkt

### Deploy shows old data
**Cause:** Railway serving cached build  
**Fix:** Run `railway up` to force new deployment (git push alone won't trigger)

### Deceased/retired player showing
**Cause:** Player still in `players.json` from old scrape  
**Fix:** Rescrape affected league — players not on current rosters get removed

### Profile fields shifted (height in citizenship, etc.)
**Cause:** Transfermarkt changed info-table DOM structure  
**Fix:** Check `span.info-table__content--regular` / `--bold` pairing in scraper

### Build fails on Railway
**Cause:** Usually Node version mismatch  
**Fix:** Ensure `.node-version` = `22` and `package.json` has `"engines": {"node": ">=22.0.0"}`

---

## 7. Data Freshness

| Data Type | How Often to Refresh | Method |
|-----------|---------------------|--------|
| Romanian rosters | Every transfer window + monthly | `rescrape_romania.py` |
| All league rosters | Start of each season + mid-season | `scraper_complete.py` or `scraper_full_rosters.py` |
| Player profiles (age, height, etc.) | After bulk scrape | `enrich_data.py` |
| Career stats | Quarterly | `scraper_complete.py` with profile scraping |

### Current Data Coverage (as of 2026-02-05, post-rescrape)

```
Total players:    15,259
Leagues:          37 (28 active + 9 recovered)
Position filled:  99.7%
Age filled:       99.9%
Height filled:    ~78% (from enrichment, not roster pages)
Foot filled:      ~76% (from enrichment, not roster pages)
Career stats:     ~90% (preserved from previous enrichment)
```

Romanian leagues (RO1+RO2): 1,065 players, **100% age + position coverage**

Note: Player count dropped from ~16K to ~15K because:
1. Players not on current 2025/26 rosters were removed (transfers, retirements, deceased)
2. RO3 no longer available on Transfermarkt

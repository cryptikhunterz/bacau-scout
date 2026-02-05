# Bacau Scout — Changelog

All notable changes to the Bacau Scout platform are documented here.

---

## 2026-02-05 — Search Bug Fixes & Data Deduplication

### Bug: Duplicate Player Rows in Search Results
**Reported by:** Crypwalk (via screenshot)
**Symptom:** Searching a Transfermarkt URL (e.g. `transfermarkt.com/abdel-zagre/profil/spieler/864101`) showed multiple phantom rows — other players like Aaron Ciammaglichella and Abdeldjalil Hachem appeared alongside the correct result (Abdel Zagrè).

**Root cause:** `players.json` contained 659 duplicate `player_id` entries (22,306 total, only 21,647 unique). Players appearing on multiple rosters (loans, dual registrations) were stored as separate entries. React's `key={player.player_id}` caused key collisions — React reused stale DOM nodes from previous renders, displaying ghost rows that didn't match the actual filtered data.

**Fix:**
1. Wrote deduplication script that keeps the most complete record per `player_id` (scored by non-null field count, career stats presence)
2. Reduced `players.json` from 22,306 → 21,647 entries
3. Changed React key from `player.player_id || idx` to `${player.player_id}-${idx}` to prevent future key collisions

**Files changed:**
- `public/players.json` — deduplicated
- `src/app/search/page.tsx` — key prop fix

---

### Bug: Hardcoded Player/League Count
**Reported by:** Crypwalk ("left and right side of the search bar disagree")
**Symptom:** Header left side showed dynamic filtered count ("1 players") but right side always showed static "15,969 players • 35 leagues" regardless of actual data or filters.

**Root cause:** Right-side stats were hardcoded JSX string, never updated since initial development.

**Fix:** Replaced hardcoded text with dynamic values:
```tsx
// Before
<div>15,969 players • 35 leagues</div>

// After
<div>{players.length.toLocaleString()} players • {leagues.length} leagues</div>
```

**Files changed:**
- `src/app/search/page.tsx`

---

### Optimization: URL Search Extraction
**What:** URL detection logic ran the `spieler/(\d+)` regex inside the `.filter()` callback — once per player (21,647 times per keystroke).

**Fix:** Extracted URL player ID once before the filter loop. Also added guard so any `transfermarkt`-containing string that doesn't match the `spieler/ID` pattern returns empty results instead of falling through to text search.

```tsx
// Before: regex runs 21,647 times
players.filter(p => {
  if (search.includes('transfermarkt') && search.includes('spieler')) {
    const match = search.match(/spieler\/(\d+)/);
    if (match) return p.player_id === match[1];
  }
})

// After: regex runs once
let urlPlayerId = null;
if (search.includes('transfermarkt') && search.includes('spieler')) {
  const match = search.match(/spieler\/(\d+)/);
  urlPlayerId = match ? match[1] : null;
}
players.filter(p => {
  if (urlPlayerId !== null) return p.player_id === urlPlayerId;
})
```

**Files changed:**
- `src/app/search/page.tsx`

---

## 2026-02-05 — Full Rescrape & Season Fix

### Bug: Stale Season Data (saison_id/2024)
**Reported by:** Flavius (scout)
**Symptom:** Players showing last season's clubs, wrong stats, deceased player (Aaron Boupendza) on front page.

**Root cause:** Hardcoded `saison_id/2024` in all scraper scripts. AI training data made 2024 feel "current" despite it being Feb 2026. This pulled 2024/25 season rosters instead of 2025/26.

**Fix:**
1. Replaced all hardcoded `saison_id` values with `get_current_season()` function:
   ```python
   def get_current_season():
       now = datetime.now()
       return now.year if now.month >= 8 else now.year - 1
   ```
2. Full rescrape of all 37 leagues with correct 2025/26 data
3. Added "Date Awareness" rule to AGENTS.md as permanent safeguard

**Result:** 15,259 players across 37 leagues, 99.9% age coverage, 99.7% position coverage

---

### Bug: 6 Changed Transfermarkt League Codes
**Symptom:** 0 teams returned or 302 redirects for certain leagues.

**Fix:** Updated league code mappings:
| Old Code | New Code(s) | League |
|----------|------------|--------|
| `KOS1` | `KO1` | Kosovo Superliga |
| `SK1` | `SLO1` | Slovakia Niké Liga |
| `PO3` | `PT3A` | Portugal Liga 3 |
| `FR4` | `CN2A`, `CN2B`, `CN2C`, `CN2D` | France National 2 (4 groups) |
| `ES3` | `ES3A`, `ES3B` | Spain Primera RFEF (2 groups) |

---

### Bug: Railway Deploy Failing (Node Version)
**Symptom:** Builds failed silently on Railway.

**Root cause:** Railway defaulted to Node 18, but Next.js 16 requires Node ≥22.

**Fix:** Added `.node-version` file (`22`) and `engines` field in `package.json`.

---

## 2026-02-04 — Apify Scraper v2.0

See `../projects/apify-transfermarkt/UPGRADE_PLAN.md` for full details.

- Market value history, transfer history, career stats
- 3 scraping modes (leagues, player URLs, club URLs)
- Multi-locale support
- 50+ leagues
- Published to Apify Store

---

## 2026-02-03 — Initial Railway Deployment

- Deployed Next.js 16 app to Railway with PostgreSQL
- Prisma schema for grades/evaluations
- 15 scouts sharing access
- Rating scale 1-8 (Liga 3a → Superliga playoff)

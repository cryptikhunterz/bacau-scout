# Session Prime: Football Scouting MVP

## Project Overview

Building a football scouting tool that mirrors Transfermarkt data into our own database for instant search and display. MVP competing with tools like Scoutastic ($10k/year).

---

## IMPLEMENTATION PLAN FOR CLAUDE CODE

### Phase 1: Data Import (15 min)
**Goal:** Get 750 players from JSON into Supabase

1. Create import script at `/scripts/import-data.ts`
2. Parse JSON file at `/Users/ocoulibaly/Desktop/Bacau scout prototype /JSON.json`
3. Transform data to match schema
4. Upsert to Supabase `players` table
5. Verify: `SELECT COUNT(*) FROM players` = 750

### Phase 2: Next.js Setup (10 min)
**Goal:** Scaffold the app

1. Create Next.js 14 app with TypeScript + Tailwind
2. Install dependencies: `@supabase/supabase-js`
3. Set up environment variables
4. Create Supabase client in `/lib/supabase.ts`

### Phase 3: Search API (15 min)
**Goal:** Backend endpoints working

1. `GET /api/players?q=` - Search by name OR Transfermarkt URL
2. `GET /api/players/[id]` - Get single player by ID
3. Handle URL detection (if query contains `transfermarkt.com`, extract player ID)

### Phase 4: Home Page UI (20 min)
**Goal:** Search box that works

1. Single search input (accepts name OR Transfermarkt URL)
2. Debounced search (300ms)
3. Results as clickable cards showing: name, club, position, market value, photo
4. Click card → navigate to `/player/[id]`

### Phase 5: Profile Page UI (30 min)
**Goal:** Player profile matching Scoutastic layout

1. Large photo + player name header
2. Info grid: position, club, birth date, nationality, market value
3. Stats section with "View full stats on Transfermarkt" link (placeholder for v2)
4. External links section

### Phase 6: Polish & Test (15 min)
**Goal:** Working local demo

1. Loading states
2. Error handling (player not found, network errors)
3. Image fallback if photo fails to load
4. Test with 5-10 different players

---

## CURRENT DATA STATUS

### Available Data (750 players)
**File:** `/Users/ocoulibaly/Desktop/Bacau scout prototype /JSON.json`

**Fields in JSON:**
```json
{
  "url": "https://www.transfermarkt.com/player-name/profil/spieler/123456",
  "name": "Player Name",
  "position": "Centre-Forward",
  "age": 25,
  "dateOfBirth": "Jan 1, 1999",
  "currentClub": "FC Example",
  "marketValue": "€5.00m",
  "nationality": "Romania"
}
```

### Player Images
**Pattern:** `https://img.a.transfermarkt.technology/portrait/big/{player_id}-1.jpg`

**Extract player_id from URL:** `/spieler/(\d+)` → e.g., `123456`

### Missing Data (v2 - will add via R package later)
- Career stats (appearances, goals, assists)
- Height, foot, contract end

---

## TECHNICAL SPECIFICATIONS

### Supabase Project
- **Name:** Bacau transfer prototype
- **Schema already created** (players table with indexes)

### Database Schema
```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,                    -- Transfermarkt player ID
  tm_url TEXT,
  name TEXT NOT NULL,
  full_name TEXT,
  date_of_birth TEXT,                     -- Keep as text for now
  age INTEGER,
  nationality TEXT[],
  position TEXT,
  current_club TEXT,
  current_club_id TEXT,
  league TEXT,
  market_value_raw TEXT,
  market_value_eur BIGINT,
  height_cm INTEGER,
  foot TEXT,
  agent TEXT,
  image_url TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_name_search ON players USING gin(to_tsvector('english', name));
CREATE INDEX idx_players_name_ilike ON players (lower(name));
CREATE INDEX idx_players_club ON players(current_club);
CREATE INDEX idx_players_market_value ON players(market_value_eur DESC NULLS LAST);
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=<from Supabase dashboard>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard - for import script>
```

---

## FILE STRUCTURE

```
/bacau-scout
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home - search box + results
│   │   ├── player/
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Player profile
│   │   ├── api/
│   │   │   └── players/
│   │   │       ├── route.ts            # GET /api/players?q=
│   │   │       └── [id]/
│   │   │           └── route.ts        # GET /api/players/[id]
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── SearchBar.tsx
│   │   ├── PlayerCard.tsx
│   │   └── PlayerProfile.tsx
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client
│   │   └── utils.ts                    # parseMarketValue, extractPlayerId
│   └── types/
│       └── index.ts                    # Player type definition
├── scripts/
│   └── import-data.ts                  # One-time import script
├── .env.local
├── package.json
└── tsconfig.json
```

---

## KEY CODE SNIPPETS

### Extract Player ID from URL
```typescript
function extractPlayerId(url: string): string | null {
  const match = url.match(/\/spieler\/(\d+)/);
  return match ? match[1] : null;
}
```

### Parse Market Value
```typescript
function parseMarketValue(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[€,]/g, '').trim();
  const match = cleaned.match(/^([\d.]+)(k|m)?$/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const multiplier = match[2]?.toLowerCase() === 'm' ? 1_000_000 
                   : match[2]?.toLowerCase() === 'k' ? 1_000 : 1;
  return Math.round(num * multiplier);
}
```

### Generate Image URL
```typescript
function getPlayerImageUrl(playerId: string): string {
  return `https://img.a.transfermarkt.technology/portrait/big/${playerId}-1.jpg`;
}
```

### Search API Logic
```typescript
// If query contains transfermarkt.com → extract ID and lookup directly
// Otherwise → full-text search on name
if (query.includes('transfermarkt.com')) {
  const id = extractPlayerId(query);
  // SELECT * FROM players WHERE id = $1
} else {
  // SELECT * FROM players WHERE name ILIKE '%query%' ORDER BY market_value_eur DESC LIMIT 50
}
```

---

## PROFILE PAGE LAYOUT

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────┐  PLAYER NAME                                     │
│  │          │  Position: Right Winger                          │
│  │  PHOTO   │  Club: FC Example                                │
│  │          │  Age: 25 · Born: Jan 1, 1999                     │
│  │          │  Nationality: 🇷🇴 Romania                        │
│  └──────────┘  Market Value: €5.00m                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PERFORMANCE DATA                                               │
│                                                                 │
│  Stats coming in v2. For now:                                  │
│  [View full stats on Transfermarkt →]                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [← Back to Search]     [Open in Transfermarkt]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## MVP FEATURES (2 only)

1. **Paste Transfermarkt URL → Show player profile**
2. **Search player name → Show player profile**

---

## RUN LOCALLY

```bash
# After build
cd bacau-scout
npm run dev
# Open http://localhost:3000
```

---

## NEXT ACTIONS FOR CLAUDE CODE

1. **First:** Get Supabase credentials from user
2. **Then:** Execute phases 1-6 in order
3. **Test:** Search for a few players, verify profiles display correctly

---

## FUTURE (v2)

- [ ] Add career stats via worldfootballR (R package)
- [ ] Expand to more leagues (currently 21 leagues, 750 players)
- [ ] Add shortlists feature
- [ ] Weekly data sync
- [ ] Deploy to Vercel

---

**STATUS: Ready for Claude Code to execute Phase 1-6**

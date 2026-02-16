# Feature: Add Player On-the-Spot

## Problem
Scouts find players not in our database (we only scrape ~40 leagues). They message us manually with a Transfermarkt link and wait for someone to add it. This doesn't scale.

## Solution
**"Add Player" button** — scouts paste a Transfermarkt URL, we scrape and add the player in real-time.

## How It Works

### User Flow
1. Scout searches for a player → **not found**
2. Search results show: _"Player not found? Add them →"_ button
3. Scout pastes the **Transfermarkt URL** (any TM domain: .com, .ro, .de, etc.)
4. System scrapes the profile in real-time (2-3 seconds)
5. Player appears → scout can immediately grade them

### Technical Design

#### New API Endpoint: `POST /api/players/add`

**Request:**
```json
{
  "transfermarktUrl": "https://www.transfermarkt.com/almamy-soumah/profil/spieler/1451940"
}
```

**What it does:**
1. Extract player ID from URL (reuse `extractPlayerIdFromUrl()`)
2. Check if player already exists in `players.json` → return existing if so
3. Scrape TM profile page (server-side fetch + parse)
4. Build player object matching our `RawPlayer` schema
5. Append to `players.json` 
6. Clear in-memory cache (`playersCache = null`)
7. Return the new player data

**Response:**
```json
{
  "status": "added",
  "player": { "player_id": "1451940", "name": "Almamy Soumah", ... }
}
```

#### Scraping Logic (server-side)

Parse the TM profile HTML for:
- Name, position, age, DOB, height, foot
- Nationality/citizenship
- Current club, league
- Contract expiry
- Photo URL
- Career stats (if available)
- Market value

We already know the TM HTML structure from our Apify scraper — can reuse that parsing logic.

#### Frontend Changes

**Search page (`/search`):**
- When results are empty, show an "Add Player" card
- Input field for TM URL + "Add" button
- Loading state while scraping (spinner, "Fetching player data...")
- Success → redirect to player profile or show in search results

**Optional: Admin-only gate**
- Could restrict to admin/scout role (prevent abuse)
- Or: rate limit (max 10 adds per scout per day)

### Edge Cases
- **Invalid URL** → show error "Please paste a valid Transfermarkt player URL"
- **Player already exists** → show "Player already in database" + link to profile
- **TM blocks/rate limits** → show "Could not fetch player data, try again later"
- **Duplicate adds (race condition)** → check by player_id before writing

### Data Persistence
Currently `players.json` is baked into the deploy. Options:

**Option A: Write to JSON + auto-commit (simple)**
- Write to `players.json` on the server filesystem
- Works immediately (cache cleared)
- Survives redeploys if we commit periodically
- Risk: Railway ephemeral filesystem loses additions on redeploy

**Option B: Hybrid — JSON base + DB overlay (recommended)**
- Keep `players.json` as the base dataset (scraped leagues)
- Store manually-added players in PostgreSQL `ManualPlayer` table
- `loadPlayers()` merges both sources
- Survives redeploys, no filesystem risk
- Can track who added what and when

**Option C: Full DB migration**
- Move all players to PostgreSQL
- Best long-term but biggest migration effort
- Overkill for now

### Recommendation
**Go with Option B** — it's the smallest change that's production-safe:
1. New Prisma model `ManualPlayer` (same fields as RawPlayer)
2. `/api/players/add` writes to DB
3. `loadPlayers()` loads JSON + DB, merges, dedupes by player_id
4. Zero risk of losing manually-added players on redeploy

### Priority / Effort
- **Priority:** High (scouts need this regularly)
- **Effort:** ~4-6 hours
  - API endpoint + TM scraping: 2h
  - Prisma model + migration: 1h  
  - Frontend (search page add button): 1-2h
  - Testing + deploy: 1h

### Future Enhancements
- Bulk add (paste multiple URLs)
- Auto-refresh player data periodically
- "Request player" queue (scout requests, admin approves)
- Wyscout integration (if credentials available)

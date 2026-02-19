# Changelog — 2026-02-19

## Wyscout Data Integration V3

### New: Wyscout Player IDs & Photo URLs
- Re-scraped all 32 competitions with embedded Wyscout player IDs (99.8% coverage)
- 14,914 TM players enriched with 100 Wyscout advanced stats
- Player IDs extracted from image title attributes in Wyscout table
- Photo URLs captured for potential future use

### New: Position-Specific Radar Metrics (Crypwalk's Specs)
8 position groups with hand-picked metrics:
- **GK**: Long pass acc %, shots against/90, conceded/90, save %, aerial won %
- **CB**: Pass acc %, PAdj Interceptions, tackle success %, fouls/90, aerial/90, aerial won %, long passes/90, long pass success %
- **FB**: Pass acc %, key passes/90, crosses/90, cross success %, dribbles/90, dribble success %, PAdj Interceptions, fouls/90, aerial/90, aerial won %
- **DM**: PAdj Interceptions, pass acc %, passes/90, def duels/90, def duels success %, fouls/90
- **CM**: Duels won %, PAdj Interceptions, fwd pass acc %, key passes/90, long passes/90, final third passes/90, assists/90
- **AM**: Goals/90, shots/90, box touches/90, assists/90, key passes/90, final third passes/90, pass acc %, dribbles/90, dribble success %
- **W**: Crosses/90, cross success %, goals/90, shots/90, goal conversion %, box touches/90, assists/90, key passes/90, final third passes/90, pass acc %, dribbles/90, dribble success %
- **CF**: Goals/90, shots/90, shots on target %, goal conversion %, box touches/90, assists/90, key passes/90, pass success %, dribbles/90, dribble success %

### Fix: Duplicate Radar Graphs
- `WyscoutStats` was rendering its own radar charts AND `WyscoutRadars` was rendering radars
- Both were shown via `WyscoutStatsWrapper` → double graphs on player pages
- Removed radar charts from `WyscoutStats` — it now only shows stat bars
- Added `WyscoutRadars` to the report page which was missing it

### New: Admin-Only Film Room & Targets
- Scouting Reports (Film Room) page now requires admin role
- Targets page now requires admin role
- Nav links hidden from non-admin users on dashboard
- Regular scouts can still grade players, search, compare — just can't see AI analysis

### Updated: Wyscout API Route — 3-Tier Data Resolution
1. Percentile data (wyscout-percentiles.json) — if available
2. Embedded wyscout data from players.json — NEW, converts ws_ keys to display format
3. Legacy wyscout-metrics.json — fallback

### Updated: Position Mapping
- `mapTmPositionToGroup()` now returns fine-grained groups: gk, cb, fb, dm, cm, am, winger, forward
- Fullbacks separated from centre-backs
- DM/CM/AM each have their own group
- Wingers separated from forwards

### Updated: Team Compare
- `WyscoutTeamCompare.tsx` ALLROUND_KEYS updated to match new overall metrics

### Files Changed
- `src/lib/wyscoutRadar.ts` — Complete metric config rewrite
- `src/app/api/players/[id]/wyscout/route.ts` — 3-tier data source
- `src/components/WyscoutStats.tsx` — Removed duplicate radars, legacy data support
- `src/components/WyscoutRadars.tsx` — New position groups
- `src/components/WyscoutTeamCompare.tsx` — Updated allround keys
- `src/app/report/[playerId]/page.tsx` — Added WyscoutRadars, removed unused import
- `src/app/scouting-reports/page.tsx` — Admin-only gate
- `src/app/targets/page.tsx` — Admin-only gate
- `src/app/page.tsx` — Hide Film Room & Targets for non-admin
- `public/players.json` — Enriched with Wyscout V3 data (IDs + 100 stats)

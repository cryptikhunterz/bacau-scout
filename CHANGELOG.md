# CHANGELOG — Bacau Scout (CSM Ceahlăul Piatra)

## 2026-02-19

### Added — Position Template Selector (Option A)
- **Pre-computed percentiles for ALL position templates** per player in `wyscout-percentiles.json`
  - Each player now includes a `templates` object with GK, CB, WB, DM, CM, AM, FW entries
  - Each template contains `radar` and `allround` arrays with percentiles computed against that position pool globally
  - Backward compatible: existing top-level `radar` and `allround` fields unchanged (natural position)
- **Template selector dropdown** added to:
  - `WyscoutRadars.tsx` — single player radar view (now uses pre-computed data instead of label remapping)
  - `WyscoutStats.tsx` — single player stat bars view
  - `WyscoutCompare.tsx` — side-by-side player comparison view
- Selecting a template recomputes all percentile bars and radar charts against the chosen position pool
- Default is player's natural position (`pg` field); "Reset" button restores natural position
- File size: `wyscout-percentiles.json` grew from ~34MB to ~106MB (approved)
- API route updated with `TemplateData` interface; passes templates through transparently

### Added — Transfer Targets: DM & CB Tabs
- **Tab navigation** on `/targets` page: Strikers | DMs | CBs (defaults to Strikers)
- **DM shortlist** (4 players): Dican (Farul), Sierra (Argeș), Petro (Botoșani), Végh (Csikszereda)
  - DM-specific comparison table: Interceptions/90, Def Duels/90, Def Duels Won%, Passes/90, Pass Acc%, Fouls/90
  - Position-specific player cards with defensive metrics from Wyscout V2
- **CB shortlist** (5 players): Dinu (Slobozia), Camara (Metaloglobus), Pašagić (Metaloglobus), Hegedűs (Csikszereda), Né Lopes (Oțelul)
  - CB-specific comparison table: Aerial Duels/90, Aerial Won%, Def Duels Won%, Interceptions/90, Pass Acc%, Fouls/90
  - Position-specific player cards with aerial and defensive metrics from Wyscout V2
- All stat values pulled from `data/wyscout-scraped-v2/Romania_SuperLiga__AllColumns.json`
- Existing striker data and layout completely untouched

### Added
- `reports/film-scouting-report-dm.md` — Film-based DM scouting report with Wyscout video analysis (Sierra, Dican, Végh)
- `reports/film-scouting-report-cb.md` — Film-based CB scouting report with Wyscout video analysis (Camara, Pašagić, Dinu)
- `reports/romanian-dm-scouting.md` — Defensive Midfielder scouting report (5 targets + honourable mentions)
- `reports/romanian-cb-scouting.md` — Centre-Back scouting report (5 targets + honourable mentions)
- `reports/screenshots/` — 13 Wyscout video frame captures from actual match footage
  - DM Sierra: 5 screenshots (interception, tackle, positioning, goal, passing)
  - DM Dican: 3 screenshots (interception, defending duel, aerial duel)
  - DM Végh: 1 screenshot (defending duel)
  - CB Camara: 2 screenshots (interception, 1v1 defense)
  - CB Pašagić: 1 screenshot (interception)
  - CB Dinu: 1 screenshot (defending duel)
- `CHANGELOG.md` — This file

### Data Sources
- Wyscout (hudl) Player Rankings — Romania Superliga 2025/2026
- Defence → Interceptions Per 90 (expanded table with positions, market values, bio data)
- Defence → Defensive Duels % Success (expanded table)
- Defence → Aerial Duels, Shots Blocked, Fouls rankings

### Key Findings
- **DM Priority Target:** R. Sierra (Argeș, 29, 🇪🇸, €250K) — league leader in minutes, elite interceptions
- **CB Priority Target:** A. Dinu (U. Slobozia, 27, 🇷🇴, €150K) — Romanian, 79.1% duel success
- **Budget CB Raid:** Camara + Pašagić from Metaloglobus (~€200K total)

### In Progress
- [ ] Video clip analysis with frame-by-frame screenshots for top targets
- [ ] Liga II DM/CB scouting pass
- [ ] Contract expiry research
- [ ] Live scout visit scheduling

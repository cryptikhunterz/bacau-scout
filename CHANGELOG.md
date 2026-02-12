# Changelog

## 2026-02-12 (v17) — Dynamic Radars Across ALL Pages (No Hardcoding)

### Changed
- **CRITICAL FIX: All radar charts now use dynamic metrics from actual player data** — no more hardcoded metric templates per position. Follows the enrichment platform's approach exactly.
- **`WyscoutStats.tsx` (Player Profile)**:
  - Position Radar uses `radar[]` from API; falls back to dynamic build from ALL metrics if < 3
  - Percentile Profile uses `allround[]` from API; falls back to remaining metrics if < 3
  - Stat bars now show ALL metrics present in the data, categorized dynamically (Attack/Defence/Passing/Goalkeeping/Other)
  - Removed hardcoded `METRIC_GROUPS` key arrays — replaced with `METRIC_CATEGORY_MAP` for categorization only
- **`WyscoutRadars.tsx` (Report Page)**:
  - Same dynamic radar building — no hardcoded metric lists
  - Removed legacy raw mode fallback (no longer needed with enrichment data)
- **`compare/page.tsx` (Player Compare)**:
  - **DELETED all `PG_RADAR_TEMPLATES` and `ALLROUND_TEMPLATE`** — 100+ lines of hardcoded position metrics removed
  - **REMOVED Radar Template dropdown** — radars now show what data exists
  - Position Radar uses UNION of all selected players' `radar` metrics
  - Percentile Profile uses UNION of all selected players' `allround` metrics
  - All selected players rendered as overlays (supports 3+ players)
- **`compare/teams/page.tsx` (Team Compare)**:
  - **DELETED hardcoded `ALLROUND_KEYS` and `ALLROUND_LABELS`**
  - Dynamic UNION of all metric keys across all teams' players
  - Radar, stat bars, and metrics table all use dynamic keys
  - Supports 3+ team overlays on radar charts
- **`WyscoutTeamCompare.tsx`**: Rewritten with dynamic aggregation, no hardcoded keys
- **`sync-from-enrichment.py`**:
  - `radar[]` contains enrichment's `r` config (position-specific), or dynamic build if < 5
  - `allround[]` contains ALL remaining metrics with percentiles (no cap — was capped at 10)
  - Better label formatting matching enrichment frontend
  - Regenerated data files

### Key Principle
Copied exactly how the enrichment platform does it:
- Takes ALL metrics with percentiles
- Sorts position-specific ones first
- Caps at 16 for radars
- DYNAMIC. NOT HARDCODED.

### Verified Players
- Cîrstean (940237): 16 radar + 6 allround ✅
- Chirilă (548417): 8 radar + 19 allround ✅
- Cruceru (315448): 7 radar + 27 allround ✅
- Moukhliss (495622): 6 radar + 29 allround ✅

## 2026-02-12 (v16) — Regenerated Wyscout Data with Wyscout Position Mapping

### Changed
- **Regenerated `wyscout-metrics.json` and `wyscout-percentiles.json`** from the enrichment platform's correctly matched data (16,261 entries → 12,105 with metrics → 9,742 qualifying for percentiles)
- **Position mapping now uses Wyscout positions** instead of Transfermarkt positions — more accurate grouping since Wyscout positions (DMF, LCMF, LW, CF, etc.) reflect actual on-pitch roles rather than Transfermarkt's broader categories
- Position groups: AM 1,515 | CB 1,880 | CM 1,300 | DM 702 | FW 1,754 | GK 756 | WB 1,835

### Added
- **`scripts/regenerate-wyscout-from-enrichment.py`** — Unified script that generates both data files in one run:
  - Reads from `wyscout-enrichment/data/matched/matches.json`
  - Extracts primary Wyscout position from compound strings (e.g., `"DMF, RDMFDMF (69%)RDMF (11%)"` → DMF)
  - Maps Wyscout positions to 7 position groups (GK/CB/WB/DM/CM/AM/FW)
  - Falls back to Transfermarkt position when Wyscout position can't be parsed
  - Computes league percentiles (within position group + competition) and global percentiles (within position group across all leagues)
  - Includes verification of specific players and metric coverage stats
  - Cross-checks all metric keys against `wyscoutRadar.ts` definitions

### Notes
- Chirilă (1073380) is correctly matched to Cincinnati II / MLS Next Pro — his Wyscout profile has 34 metrics but only attacking stats (no defensive duels data from Wyscout)
- Cruceru (315448) now correctly mapped to CM (from Wyscout LCMF) instead of AM (from Transfermarkt "Attacking Midfield")

## 2026-02-12 (v15) — Enrichment Radar, Compare Fixes & Scout Reference Data

### Changed
- **Enrichment-style Percentile Radar** — New `PercentileRadar` component replaces the "All-Around Profile" radar across the app:
  - Circular green-zone backgrounds: Top 10% (dark green outer ring), Above Avg (medium green), Average (dark muted), Below Avg (dark innermost)
  - Blue polygon for the player's percentile stats with zone-colored dots
  - Optional dashed comparison overlay for second player
  - Metric labels around outside with color-coded raw values (green for high, red for low)
  - Built-in legend: Top 10%, Above Avg, Average, Below Avg
  - Applied on: Player profile radars (`WyscoutRadars`), player stats (`WyscoutStats`), and compare page
  - Position-specific radar (left) kept unchanged — scouts love it

### Fixed
- **Compare page: Missing stats for partial-data players (Cruceru fix)** — Previously, only shared metrics between compared players were shown. Now ALL metrics from ALL players appear, with "—" displayed for any metric a player doesn't have. Uses a union approach instead of intersection.
- **Compare page: Radar template switching** — Position template selector (GK/CB/WB/DM/CM/AM/FW) now uses canonical metric definitions per position group rather than depending on player data. Switching templates correctly re-renders radars with the new position's metrics regardless of which players are selected.
- **Compare page: Bar scaling** — Confirmed bars use FIXED 0–100% scale based on percentile. If p84 → bar fills 84%. If p30 → bar fills 30%. Never relative to best player. Also shows "—" for missing percentiles instead of hiding.

### Added
- **`PercentileRadar` component** (`src/components/PercentileRadar.tsx`) — Standalone enrichment-style SVG radar with green zone backgrounds, fully reusable
- **Canonical position templates** — Hardcoded radar metric definitions for all 7 position groups (GK, CB, WB, DM, CM, AM, FW) plus all-round template on compare page, ensuring template switching works even without matching player data

## 2026-02-12 (v14) — Compare Pages Redesign (Enrichment Platform Style)

### Changed
- **Player Compare page** — Complete redesign to match the Wyscout Enrichment Platform's compare layout:
  - Support for up to 3 players (was 2)
  - Unified search bar instead of separate Player 1 / Player 2 search boxes
  - Player cards show name, position, club, age, minutes, market value, and Wyscout position group
  - Position template selector for radar view (GK, CB, WB, DM, CM, AM, FW)
  - League/Global percentile toggle
  - Two overlay radar charts side by side: Position-specific + All-Round profiles
  - Stacked horizontal bar graphs for each Wyscout metric (one bar per player, colored blue/red/green)
  - Raw value shown on right, percentile badge ("p79", "p83") on far right of each bar
  - Full metrics comparison table with best-value highlighting
  - Removed old Career Totals, Per-90, and Season-by-Season sections (replaced by Wyscout data)
  - Removed separate `WyscoutCompare` component (functionality integrated directly)
- **Team Compare page** — Complete redesign to match the Enrichment Platform:
  - Support for up to 3 teams (was 2)
  - Unified search bar instead of separate Team 1 / Team 2 boxes
  - Team cards show club, league, squad size, total market value, Wyscout data count
  - Two overlay radar charts: Percentile + Raw stats (squad-averaged)
  - Stacked horizontal bars for 10 all-round metrics with percentile annotations
  - Full metrics comparison table
  - League/Global percentile toggle
  - Full squad lists preserved at the bottom
  - Removed old Squad Overview, Position Breakdown, Squad Performance bar sections (replaced by Wyscout data)
  - Removed separate `WyscoutTeamCompare` component (functionality integrated directly)

### Visual Style
- Dark theme (zinc-950/900 backgrounds) matching enrichment platform
- Bar colors: blue for player/team 1, red for 2, green for 3
- Percentile annotations shown as colored "p79" text using standard color scale

## 2026-02-12 (v13) — Enrichment Platform Stats Integration

### Added
- **`WyscoutStats` component** — Full Wyscout advanced metrics section for player profile pages, replicating the enrichment platform's layout:
  - League/Global percentile toggle
  - Dual radar charts (Position-specific + All-round profiles)
  - Detailed metric tables with percentile bars grouped by Attack, Defence, Passing, and Goalkeeping
  - Color-coded percentile indicators (emerald ≥81, green ≥61, yellow ≥41, amber ≥21, red <21)
  - Percentile bar graphs showing where the player ranks
- **`WyscoutCompare` component** — Wyscout advanced metrics comparison for the player compare page:
  - Side-by-side overlay radar charts (position-specific and all-round)
  - Bar graph comparisons with percentile annotations for each metric
  - Full metrics comparison table with best-value highlighting
  - League/Global toggle
- **`WyscoutTeamCompare` component** — Aggregated team-level Wyscout stats for the team compare page:
  - Fetches Wyscout data for all players with player IDs on each team
  - Computes squad-averaged percentiles and raw values across 10 all-round metrics
  - Overlay radar chart comparing team averages
  - Bar graph and metrics table with team-level comparisons
  - League/Global toggle

### Changed
- **Player profile page** — Added Wyscout Advanced Metrics section between Season-by-Season stats and Scout Evaluation form. Career Overview (appearances/goals/assists/minutes) preserved at the top. All existing features untouched.
- **Player compare page** — Added Wyscout comparison section after Season-by-Season comparison. Existing Career Totals, Per-90 & Ratios, and season comparisons all preserved.
- **Team compare page** — Added Wyscout Team Metrics section before Full Squads listing. Existing Squad Overview, Position Breakdown, and Squad Performance sections all preserved.

## 2026-02-12 (v12) — Percentile-Based Radar Charts

### Added
- **Percentile computation script** (`scripts/compute-wyscout-percentiles.py`) — pre-computes percentile rankings for 9,741 qualified players (≥3 matches, ≥180 minutes) across 7 position groups (GK, CB, WB, DM, CM, AM, FW) and 32 leagues. Outputs `public/wyscout-percentiles.json`.
- **League vs Global percentiles** — each metric is ranked both within the player's position group + league (league percentile) and across all leagues for the same position group (global percentile).
- **Percentile mode on `RadarChart`** — new `mode='percentile'` prop renders:
  - Color-coded zones: green (≥90th), light green (65–89th), gray (35–64th), red (<35th)
  - Percentage grid rings at 25%, 50%, 75%, 100%
  - Dot colors change per percentile zone
  - Raw metric values shown in labels while chart shape reflects percentile
  - Blue polygon fill for percentile mode (vs green for raw mode)
- **League/Global toggle** on `WyscoutRadars` — switches between league-specific and cross-league percentile comparisons with descriptive labels.
- **Percentile legend** — visual color guide showing zone thresholds below the toggle.
- **Position-specific metrics per group** — each position group uses tailored metrics matching professional scouting standards (e.g., CB: Defensive Duel %, Aerial %, Interceptions; FW: xG, Goals, SoT%, xA).
- **Inverted metric support** — Fouls/90 is inverted (lower = better percentile).

### Changed
- **`WyscoutRadars` component** — automatically uses percentile mode when percentile data is available; falls back to legacy raw-value radars for players without percentile data. Backward compatible.
- **API route** (`/api/players/[id]/wyscout`) — serves percentile data from `wyscout-percentiles.json` when available, with `hasPercentiles` flag. Falls back to legacy `wyscout-metrics.json`.
- **`RadarChart` component** — extended with `mode`, `displayValues`, `percentiles` props while maintaining full backward compatibility for existing raw-mode usage.

## 2026-02-12 (v11) — Wyscout Advanced Metrics Integration

### Added
- **Wyscout metrics data pipeline** — Python script (`scripts/generate-wyscout-data.py`) that extracts 12,105 matched players from the Wyscout enrichment dataset and writes `public/wyscout-metrics.json` mapping Transfermarkt player_id → Wyscout per-90 metrics + position.
- **API endpoint** `GET /api/players/[id]/wyscout` — serves Wyscout metrics for a given player ID with in-memory caching for performance.
- **`WyscoutRadars` component** — reusable client component that fetches Wyscout data and renders two radar charts:
  - **Position Profile (green #22c55e)** — 8 metrics tailored to the player's position group (CB, Midfield, Winger, Forward)
  - **All-Round Profile (blue #3b82f6)** — 10 general metrics applicable to all outfield players
- **Position mapping** (`src/lib/wyscoutRadar.ts`) — maps Transfermarkt positions to Wyscout metric sets with per-axis max values for independent scaling.
- **`maxValues` prop on RadarChart** — enables independent per-axis scaling: each axis uses its own max value, percentage-based grid rings (25/50/75/100%), and raw value display. Fully backward compatible — when `maxValues` is not provided, the original integer-step behavior is preserved.

### Changed
- **Report page** (`/report/[playerId]`) — Wyscout radars appear in an "ADVANCED METRICS (WYSCOUT)" section above the existing scout evaluation radars.
- **Grading form** (`GradingForm.tsx`) — same Wyscout radars shown above the scout attribute evaluation section when data is available.

### Notes
- Missing metrics handled gracefully (displayed as 0)
- Goalkeeper position radars skipped (insufficient Wyscout GK metrics in dataset)
- Existing scout evaluation radars (1-5 scale) remain unchanged and are visually separate

## 2026-02-12 (v10) — Wyscout-Quality Radar Charts

### Changed
- **Complete radar chart redesign** — `RadarChart` component rewritten from scratch to match Wyscout professional scouting radar quality:
  - **Circular concentric gridlines** (`<circle>` elements) instead of polygon-shaped grid
  - **Filled data polygon** with semi-transparent green fill (20% opacity) and solid 2px border
  - **Dot markers** (4px filled circles) at each data vertex
  - **External labels** at each axis: attribute name in light gray (`#d4d4d8`) with value in the chart color below
  - **Dark background circle** (`zinc-900` at 60% opacity) behind the chart area
  - **Scale labels** (1–5) along the first axis in `zinc-500`
  - **Comparison overlay support**: optional second dataset with dashed line and different color
  - Props simplified: `labels, values, maxValue, color, title, size` + optional `comparisonValues/comparisonColor`
- **Grading form** — Now shows ONE large radar chart (not two side by side) with ALL individual position attributes as axes (e.g. 25+ attributes for a GK), updating in real-time as ratings change. Title shows position badge + name (e.g. "🧤 GOALKEEPER RADAR")
- **Report view** — Now shows ONE large radar chart with ALL individual attributes:
  - Position-specific reports: every attribute from every group shown as its own axis
  - Legacy reports (Physical/Technique/Tactic): all 19 individual attributes shown as axes
  - Full-width, centered above attribute breakdowns

### Removed
- Dual side-by-side radar charts (replaced with single comprehensive chart)
- `fillOpacity` prop from RadarChart (now fixed at 0.2 for professional look)
- Group-average-based radar axes (replaced with individual attribute axes)

## 2026-02-12 (v9) — Radar Charts on Report View

### Added
- **Radar charts on report view page** (`/report/[playerId]`) — Two side-by-side radar/spider charts now appear above the attribute sections when viewing saved reports:
  - **Position Web (left, green #22c55e):** Shows average score per attribute group
  - **Overall Traits (right, blue #3b82f6):** Same data with different color for visual contrast
- **Handles both data formats:**
  - New system (positionAttributes): Computes group averages from position-specific template groups (up to 6 axes)
  - Legacy reports (Physical/Technique/Tactic only): Derives 3 axes from category averages
- **Position-specific attribute display:** Reports with positionAttributes now show attributes in a 2-column grid grouped by position template categories (e.g. Defensive Actions, Offensive Actions, Physical, etc.) with Roman numeral headers

### Changed
- **Improved attribute layout on report view:** Position-specific attributes render in a balanced 2-column grid (desktop) / single column (mobile); legacy attributes remain in their original 3-column layout

## 2026-02-12 (v8) — Radar Charts & Layout

### Added
- **Radar/Spider Charts on Scouting Report** — Two SVG-based radar charts displayed side by side above the attribute sections
  - **Position Web (left, green):** Shows average score per attribute group (e.g. Defensive Actions, Offensive Actions, Physical, Technical, Tactical, Mental) on a 1-5 scale
  - **Overall Traits (right, blue):** Same category breakdown with a different color for visual contrast
  - Charts update in real-time as the scout changes attribute ratings
- **`RadarChart` reusable component** (`src/components/RadarChart.tsx`) — Pure SVG radar chart with configurable labels, values, maxValue, color, fillOpacity, title, and size
  - Concentric grid polygons with axis lines
  - Filled data polygon with dot markers
  - Value labels at each data point, outer text labels for each axis
  - Scale labels along the first axis
  - Dark theme styling (zinc-700 grid, zinc-300/500 labels)

### Changed
- **Symmetrical 2-column attribute layout** — The 6 attribute groups now render in a 2-column grid on desktop (3 groups per column), single column on mobile
- **Radar charts responsive** — Stack vertically on mobile, side by side on desktop

## 2026-02-12 (v7) — Bug Fix Batch II

### Fixed
- **MAJ-22: Better empty state for season comparison** — Replaced bare "No season data available" text with an informative empty state including a calendar icon, explanation that season-by-season breakdown isn't available, and a note that career totals are shown above.
- **MAJ-23: Improved fallback avatar for players without photos** — Fallback initials now use a consistent slate-blue gradient background (`from-zinc-600 to-zinc-700`), `leading-none` for proper vertical centering, and `select-none` to prevent text selection. This is by design — not all players have photos on Transfermarkt.
- **MAJ-26: GK stats context on player profiles** — Goalkeeper profiles now show relabeled stat cards ("Goals (rare for GK)", "Assists (rare for GK)") with a 🧤 icon, a yellow info banner explaining that saves/clean sheets aren't available from Transfermarkt, and a simplified ratio section showing Min/App instead of Goals/Game. Season table headers also show asterisks for Goals*/Assists* on GK profiles.

## 2026-02-12 (v6) — Bug Fix Batch

### Fixed
- **MAJ-19: Bar graphs use relative scaling instead of fixed 100%** — Comparison bars in `/compare` now use fixed max scales: 500 appearances, 200 goals, 150 assists, 40k minutes for career totals; 60/40/25 for season stats; 1.0 for per-90 ratios. No longer relative to the better player.
- **MAJ-20: Minutes shows 0 for both players** — Minutes data is now computed by summing `minutes` from `season_stats` (or `career_stats.stats_by_season`) when the top-level field is missing. If no minutes data exists for either player, the Minutes row shows "N/A" instead of 0.
- **MAJ-24: "Pressing" appears twice in scout evaluation form** — Renamed duplicate "Pressing" attributes across 5 position templates. Defensive Actions now uses "Counter-Press", Tactical groups use "Pressing Triggers". Affected: Full-Back, Defensive Midfield, Central Midfield, Winger, Centre-Forward.
- **MAJ-25: Player age shows "-" instead of actual age** — `StatBadge` in search page now shows "N/A" for missing age values instead of "-".
- **MAJ-27: "Report done by" auto-fills incorrectly** — Auth callbacks now explicitly pass `name` through JWT→session. GradingForm falls back to email if display name is unavailable.
- **MAJ-28: Merge platform missing "Observe" verdict** — Added "Observe" (teal) to `VERDICT_OPTIONS` between Sign and Monitor. Added to Verdict type, dashboard filter dropdown, VerdictBadge color map, and header stats bar.

## 2026-02-12 (v5)

### Fixed
- **CRITICAL: Grade values resetting to 3** — `gradeToResponse` used `|| 3` / `|| 4` fallback which treated `0` as falsy, overwriting legitimate scout-entered values. Changed all occurrences to nullish coalescing (`?? 3` / `?? 4`) in both `api/grades/[playerId]/route.ts` and `api/grades/route.ts`
- **Position-specific attributes not persisting** — `positionCategory` and `positionAttributes` were only saved to localStorage, never to the database. Added both fields to Prisma schema (`String?` and `Json?`) and wired them through POST, PUT, and GET responses

## 2026-02-12 (v4)

### Added
- **Team Comparison page** (`/compare/teams`) — select two clubs and compare them side by side with aggregated stats from the player database
- **Aggregated team stats** — squad size, average age, average & total market value, position breakdown (GK/DEF/MID/FWD), total appearances, goals, assists
- **FBRef-style horizontal bar graphs** for all team stats (blue vs red, matching player comparison styling)
- **Full squad lists** — both squads displayed below the graphs with player names, positions, ages, market values, and links to player profiles
- **Team search API** (`GET /api/teams/search?q=`) — returns unique club names matching query (autocomplete)
- **Team detail API** (`GET /api/teams/[club]`) — returns aggregated team stats and player list for a given club
- **Players/Teams tab bar** on comparison pages — easy switching between player and team comparison modes
- **Dashboard navigation** — 🏟️ Teams button added to homepage header
- Dark theme matching existing app (bg-zinc-950, zinc-900 cards, zinc-800 borders)

## 2026-02-12 (v3)

### Added
- **Admin edit for scouting reports** — admins (`role="admin"`) can now edit any scout's existing report
- **Edit button on report view** — amber "✏️ Edit" button visible only to admin users on each scouting report
- **Admin edit form** — opens the full GradingForm pre-filled with all existing values, wrapped in an amber-bordered "Admin Edit Mode" container
- **Edit audit trail** — tracks `editedBy`, `editedById`, and `editedAt` in database; shows "✏️ Edited by [name] on [date]" on reports that have been modified
- **Admin edit API** — new `PUT /api/grades/[playerId]` endpoint for admin updates with audit logging
- **Dashboard admin buttons** — amber pencil icon on all reports for admin users (navigates to report view for editing)
- **`updateGradeAsAdminAsync()`** — new client-side function in `grades.ts` for admin edit operations
- **Cancel button** — admin edit form includes cancel button to exit edit mode without saving
- Database migration: added `editedBy`, `editedById`, `editedAt` columns to `ScoutingReport`

### Security
- Edit button and API only accessible to users with `role="admin"`
- Original scout identity preserved during admin edits (scoutName/scoutId unchanged)
- Admin identity recorded separately in audit fields

## 2026-02-12 (v2)

### Added
- **Position-specific attribute grading** — grading form now shows tailored attributes based on the player's position
- **9 position templates**: Goalkeeper 🧤, Centre-Back 🛡️, Full-Back 🏃, Defensive Midfield 🔒, Central Midfield ⚙️, Attacking Midfield 🎯, Winger ⚡, Centre-Forward ⚽, and Default/Generic 📋
- **`src/lib/positionAttributes.ts`** — new module with all position template definitions, position mapping logic, and helper functions
- **Position badge** at top of attributes section showing which template loaded (emoji + label + raw position string)
- **`positionCategory`** and **`positionAttributes`** fields added to `PlayerGrade` interface for storing position-specific ratings
- Roman numeral section headers (I–VI) for each attribute group within a position template
- Automatic position detection from Transfermarkt position strings (e.g. "Left-Back" → Full-Back template)
- Fallback to legacy generic Physical/Technique/Tactic sections for unrecognized positions
- Full backward compatibility — legacy attribute fields still saved in every grade

## 2026-02-12

### Added
- **Player photos throughout the app** — leverages `photo_url` from Transfermarkt scraping
- **PlayerAvatar component** (`src/components/PlayerAvatar.tsx`) — reusable client component with graceful error handling and initial-letter fallback
- **Player profile page** — 80×80px photo with position-colored gradient border in hero section (replaces old number/letter avatar)
- **Search results** — 32px circular thumbnails next to player names in the database table
- **Dashboard/Homepage** — 32px circular thumbnails next to graded player names (loaded via `players.json` photo lookup)
- **NormalizedPlayer** interface now includes `photoUrl` field, populated during normalization from raw `photo_url`

## 2026-02-11

### Added
- **Player Comparison page** (`/compare`) — select two players via searchable autocomplete and compare them side by side
- **Comparison bar graphs** — FBRef-style horizontal bars (blue vs red) for Career Totals (Appearances, Goals, Assists, Minutes), Per-90 stats (Goals per 90, Assists per 90, G+A per Match %), and Season-by-Season breakdown
- **Player search API** (`GET /api/players/search?q=`) — returns top 20 matches for autocomplete
- **Player detail API** (`GET /api/players/[id]`) — returns full player detail for comparison
- **Compare nav link** — added ⚖️ Compare button to Dashboard and Search page headers
- Dark theme matching existing app (bg-zinc-950, zinc-900 cards, zinc-800 borders)

## 2026-02-10

### Changed
- **Overall Ability & Potential** — Replaced numeric 1-8 badges with clickable text labels (e.g., "Liga 3a Player", "Superliga playoff player")
- **Dashboard** — ABL/POT columns now show text labels instead of numbers; sorting uses actual ability/potential values
- **Report view** — Ability/Potential displayed as colored text labels instead of number badges
- **Rubric** — Removed number references from the rating scale guide, shows label list only

### Added
- **File Upload System** — Scouts can attach PDFs, videos (Wyscout exports), and images to scouting reports
- **Attachment model** in Prisma schema with relation to ScoutingReport (cascade delete)
- **Supabase Storage integration** — files uploaded to `attachments` bucket via service role key
- **Upload API** (`POST /api/upload`) — validates file type (pdf, mp4, mov, jpg, jpeg, png, webp), size (max 50MB), uploads to Supabase, saves record in DB
- **Attachments API** (`GET/DELETE /api/attachments/[reportId]`) — list and delete attachments per report
- **FileUpload component** — drag & drop + browse, file list with icons/sizes/labels, delete buttons, max 5 files, dark zinc theme
- **GradingForm integration** — FileUpload appears between Notes and Transfer Info sections
- **Report view attachments** — images shown as thumbnails, videos as embedded players, PDFs as download links

## 2026-02-09

### Added
- **Observe** verdict option (blue) — between Sign and Monitor
- **Discard** verdict option (dark red) — for players to definitively rule out
- **Edit button** on dashboard — pencil icon appears on reports you authored, links to player profile to edit
- Verdict filter dropdown now includes all 6 options
- Header stats bar shows Observe and Discard counts

### Changed
- Verdict type expanded from 4 to 6 options: Sign, Observe, Monitor, Not a priority, Out of reach, Discard
- All verdict color maps updated across: dashboard, report view, grades table, grades filters

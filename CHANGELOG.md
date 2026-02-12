# Changelog

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

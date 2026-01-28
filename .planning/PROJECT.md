# Bacau Scout

## What This Is

A football scouting tool that provides instant search and browsing of Transfermarkt player data with a clean, fast UX. Targeting scouts who currently pay $10k/year for tools like Scoutastic that are essentially UI wrappers around the same data.

## Core Value

Clean UX for browsing — scouts will pay for a tool that's enjoyable to use, not just functional. If the data is essentially the same as competitors, the differentiation is in the experience.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Instant player search (<100ms from local database)
- [ ] Player grid/list view with key info (name, club, position, age, market value)
- [ ] Player detail page with full profile
- [ ] Filters: position, league, market value range, age
- [ ] Clean, responsive UI that feels fast

### Out of Scope

- Shortlists/saved players — v2 feature, validate core search first
- PDF/Excel export — v2, scouts need to find players before sharing
- Automated sync jobs — manual refresh via Apify console for MVP
- Additional leagues — start with existing 2,584 players (Top 5 leagues)
- Performance stats (goals, assists) — profile data only for MVP
- User authentication — single-user tool for now

## Context

**Business model validation**: Scoutastic charges $10,000/year for what is essentially a UI wrapper around scraped Transfermarkt data. The technical barrier is low; the value is in UX and workflow features.

**Data ready**: 2,584 players already scraped in JSON format with:
- Name, position
- Age
- Club
- Market value (€2.00m format)
- Nationality (supports dual nationals)
- Source league URL

**Infrastructure ready**:
- Supabase project: fuubyhubptalxwondwov.supabase.co
- Data file: ~/Desktop/Bacau scout prototype /JSON 2.json

**Architecture**: Bulk clone + local search
- Import existing JSON to Supabase once
- All searches hit local database (<100ms)
- Future: weekly Apify sync jobs

## Constraints

- **Tech stack**: Next.js 14 + Tailwind CSS + Supabase (Postgres) — matches session prime, free tier viable for MVP
- **Data format**: Must transform JSON structure during import (Player array → separate name/position fields)
- **Market value parsing**: String format "€2.00m" → needs parsing to numeric for range filters

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use existing JSON, not Apify | Data already scraped, faster to start | — Pending |
| Clean UX as differentiator | Same data as competitors, experience is the moat | — Pending |
| No auth for MVP | Single user, validate product before multi-tenant | — Pending |
| Search + browse only | Validate core value before adding features | — Pending |

---
*Last updated: 2026-01-28 after initialization*

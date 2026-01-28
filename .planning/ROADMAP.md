# Roadmap: Bacau Scout

## Overview

Build a football scouting tool with instant player search and clean UX, starting from existing scraped Transfermarkt data. The journey goes from project foundation through data import, search functionality, views, filtering, and polish to deliver a fast, enjoyable experience that differentiates from expensive competitors.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Next.js 14 project setup with Supabase connection
- [x] **Phase 2: Data Layer** - Database schema design + JSON import script
- [x] **Phase 3: Player Search** - Search API endpoint + instant search component
- [x] **Phase 4: Player List View** - Grid/list view with key player info
- [ ] **Phase 5: Filtering System** - Position, league, market value, age filters
- [ ] **Phase 6: Player Detail Page** - Full player profile view
- [ ] **Phase 7: UI Polish** - Responsive design, loading states, animations
- [ ] **Phase 8: Performance Optimization** - <100ms search guarantee, indexing

## Phase Details

### Phase 1: Foundation
**Goal**: Working Next.js 14 app with Tailwind CSS and Supabase client configured
**Depends on**: Nothing (first phase)
**Research**: Unlikely (standard Next.js + Supabase setup)
**Plans**: 1 plan

Plans:
- [x] 01-01: Project setup with Next.js 14, Tailwind CSS, and Supabase client

### Phase 2: Data Layer
**Goal**: Postgres schema with players table and working import script for JSON data
**Depends on**: Phase 1
**Research**: Unlikely (standard Postgres schema, JSON parsing)
**Plans**: 1 plan

Plans:
- [x] 02-01: Database schema and import script (576 players imported)

### Phase 3: Player Search
**Goal**: Instant search (<100ms) with real-time results as user types
**Depends on**: Phase 2
**Research**: Unlikely (standard database queries, React state)
**Plans**: 1 plan

Plans:
- [x] 03-01: Search API + SearchBar component (JSON file as data source)

### Phase 4: Player List View
**Goal**: Grid/list view displaying name, club, position, age, market value
**Depends on**: Phase 3
**Research**: Unlikely (standard React components with Tailwind)
**Plans**: 1 plan

Plans:
- [x] 04-01: PlayerCard + PlayerList components with grid/list toggle

### Phase 5: Filtering System
**Goal**: Filter players by position, league, market value range, and age
**Depends on**: Phase 4
**Research**: Unlikely (standard query building patterns)
**Plans**: TBD

### Phase 6: Player Detail Page
**Goal**: Full player profile page with all available data
**Depends on**: Phase 4
**Research**: Unlikely (standard data fetching + display)
**Plans**: TBD

### Phase 7: UI Polish
**Goal**: Responsive design with smooth loading states and transitions
**Depends on**: Phases 5, 6
**Research**: Unlikely (Tailwind CSS patterns)
**Plans**: TBD

### Phase 8: Performance Optimization
**Goal**: Guaranteed <100ms search with proper database indexing
**Depends on**: Phase 7
**Research**: Likely (database optimization)
**Research topics**: Supabase indexing strategies, full-text search optimization, query performance profiling
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/1 | Complete | 2026-01-28 |
| 2. Data Layer | 1/1 | Complete | 2026-01-28 |
| 3. Player Search | 1/1 | Complete | 2026-01-28 |
| 4. Player List View | 1/1 | Complete | 2026-01-28 |
| 5. Filtering System | 0/TBD | Not started | - |
| 6. Player Detail Page | 0/TBD | Not started | - |
| 7. UI Polish | 0/TBD | Not started | - |
| 8. Performance Optimization | 0/TBD | Not started | - |

# Flavius Radar Specs — Position-Specific Metrics
## From Wyscout Advanced Search (Feb 17, 2026)

### Goalkeepers (7 metrics)
- Long pass accuracy % ✅ → `Accurate long passes, %`
- Shots against per 90 ✅
- Conceded goals per 90 ✅
- Easy conceded goals per 90 ❌ MISSING
- Save % ✅ → `Save rate, %`
- Saves with reflex % ❌ MISSING
- Aerial duels won % ✅

### Centerbacks (9 metrics)
- Passes accuracy % ✅ → `Accurate passes, %`
- PAdj Interceptions ❌ MISSING (we have raw Interceptions per 90)
- Tackle success % ❌ MISSING (we have Sliding tackles per 90)
- Clearances ❌ MISSING
- Fouls per 90 ✅
- Aerial duels per 90 ✅
- Aerial duels won % ✅
- Long passes per 90 ✅
- Long passes success % ✅ → `Accurate long passes, %`

### Fullbacks (12 metrics)
- Passes accuracy % ✅
- Key passes per 90 ✅
- Crosses per 90 ✅
- Cross success % ❌ MISSING
- Dribbles per 90 ✅
- Dribbles success % ✅ → `Successful dribbles, %`
- Losses index ❌ MISSING
- PAdj Interceptions ❌ MISSING
- Clearances ❌ MISSING
- Fouls per 90 ✅
- Aerial duels per 90 ✅
- Aerial duels won % ✅

### Defensive Midfielder (11 metrics)
- Loose ball duels per 90 ❌ MISSING
- PAdj Interceptions ❌ MISSING
- Clearances ❌ MISSING
- Pass accuracy % ✅
- Passes per 90 ✅
- Defensive duels per 90 ✅
- Defensive duels success % ✅ → `Defensive duels won, %`
- Fouls per 90 ✅
- Recoveries per 90 ❌ MISSING
- Opponent half recoveries per 90 ❌ MISSING
- Own half losses per 90 ❌ MISSING

### Central Midfielder (9 metrics)
- Duels won % ❌ MISSING (have offensive/defensive separately)
- PAdj Interceptions ❌ MISSING
- Forward passes accuracy % ✅ → `Accurate forward passes, %`
- Key passes per 90 ✅
- Long passes per 90 ✅
- Final third passes per 90 ✅ → `Passes to final third per 90`
- Assists per 90 ✅
- Losses index ❌ MISSING
- Recoveries per 90 ❌ MISSING

### Attacking Midfielder (11 metrics)
- Goals per 90 ✅
- Shots per 90 ✅
- Touches in box per 90 ✅
- Assists per 90 ✅
- Key passes per 90 ✅
- Final third passes per 90 ✅
- Pass accuracy % ✅
- Dribbles per 90 ✅
- Dribbles success % ✅
- Loss index ❌ MISSING
- Recoveries per 90 ❌ MISSING

### Winger (13 metrics)
- Crosses per 90 ✅
- Cross success % ❌ MISSING
- Goals per 90 ✅
- Shots per 90 ✅
- Goal conversion % ❌ MISSING (can calculate: Goals / Shots)
- Touches in box per 90 ✅
- Assists per 90 ✅
- Key passes per 90 ✅
- Passes in final third per 90 ✅
- Pass accuracy % ✅
- Dribbles per 90 ✅
- Dribbles success % ✅
- Losses index ❌ MISSING

### Central Forward (12 metrics)
- Received long passes per 90 ❌ MISSING
- Goals per 90 ✅
- Shots per 90 ✅
- Shots on target % ✅
- Goal conversion % ❌ MISSING (can calculate)
- Touches in box per 90 ✅
- Assists per 90 ✅
- Key passes per 90 ✅
- Pass success % ✅ → `Accurate passes, %`
- Dribbles per 90 ✅
- Dribbles success % ✅
- Loss index ❌ MISSING

---

## Summary
- **Repeatedly missing**: PAdj Interceptions, Clearances, Losses/Loss index, Recoveries per 90
- These metrics only exist on individual Wyscout player profile pages, NOT in Advanced Search export
- **Calculable**: Goal conversion % = Goals / Shots
- **Coverage**: AM (81%), W (76%), CF (75%), GK (71%), CB (66%), FB (66%), CM (55%), DM (45%)
- Defensive positions hurt most by missing metrics

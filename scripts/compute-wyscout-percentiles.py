#!/usr/bin/env python3
"""
Compute percentile-based radar data from Wyscout enrichment matches.

Reads the matched player data, maps to position groups, computes
per-league and global percentiles, and outputs wyscout-percentiles.json.
"""

import json
import os
import sys
from collections import defaultdict

# ─── Paths ───────────────────────────────────────────────────────────────────

MATCHES_PATH = os.path.join(
    os.path.dirname(__file__),
    "../../wyscout-enrichment/data/matched/matches.json",
)
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "../public/wyscout-percentiles.json")

# ─── Position group mapping ─────────────────────────────────────────────────

POSITION_MAP = {
    "goalkeeper": "GK",
    "centre-back": "CB",
    "defender - centre-back": "CB",
    "defender": "CB",  # default defenders to CB
    "left-back": "WB",
    "right-back": "WB",
    "defender - left-back": "WB",
    "defender - right-back": "WB",
    "defensive midfield": "DM",
    "midfield - defensive midfield": "DM",
    "central midfield": "CM",
    "midfield - central midfield": "CM",
    "midfielder": "CM",  # generic midfielder → CM
    "attacking midfield": "AM",
    "midfield - attacking midfield": "AM",
    "left midfield": "AM",
    "right midfield": "AM",
    "left winger": "FW",
    "right winger": "FW",
    "attack - left winger": "FW",
    "attack - right winger": "FW",
    "second striker": "FW",
    "striker": "FW",
    "centre-forward": "FW",
    "attack - centre-forward": "FW",
}


def map_position(pos_str: str) -> str | None:
    """Map a Transfermarkt position string to a position group."""
    if not pos_str:
        return None
    p = pos_str.lower().strip()
    if p in POSITION_MAP:
        return POSITION_MAP[p]
    # Fallback heuristics
    if "goalkeeper" in p or p == "gk":
        return "GK"
    if "centre-back" in p or "center-back" in p:
        return "CB"
    if "left-back" in p or "right-back" in p:
        return "WB"
    if "defensive mid" in p:
        return "DM"
    if "attacking mid" in p:
        return "AM"
    if "midfield" in p:
        return "CM"
    if "winger" in p or "wing" in p:
        return "FW"
    if "forward" in p or "striker" in p:
        return "FW"
    if "defen" in p or "back" in p:
        return "CB"
    return "CM"  # fallback


# ─── Metric keys per position group (with non-breaking spaces) ───────────────
# Using \xa0 for the non-breaking spaces that Wyscout uses

NBSP = "\u00a0"

# Inverted metrics: lower is better
INVERTED_METRICS = {f"Fouls per{NBSP}90"}

# Position-specific radar metrics
POSITION_METRICS = {
    "GK": [
        (f"Save rate,{NBSP}%", "Save %"),
        (f"xG{NBSP}against per{NBSP}90", "xG Conc /90"),
        (f"Shots against per{NBSP}90", "Shots Ag /90"),
        (f"Exits per{NBSP}90", "Exits /90"),
        (f"Accurate passes,{NBSP}%", "Pass Acc %"),
        (f"Conceded goals per{NBSP}90", "Goals Conc /90"),
    ],
    "CB": [
        (f"Defensive duels won,{NBSP}%", "Def Duel %"),
        (f"Aerial duels won,{NBSP}%", "Aerial %"),
        (f"Accurate passes,{NBSP}%", "Pass Acc %"),
        (f"Interceptions per{NBSP}90", "Intercept /90"),
        (f"Successful defensive actions per{NBSP}90", "Ball Rec /90"),
        (f"Defensive duels per{NBSP}90", "Def Chall /90"),
        (f"Shots blocked per{NBSP}90", "Blocks /90"),
        (f"Fouls per{NBSP}90", "Fouls /90"),
    ],
    "WB": [
        (f"Defensive duels won,{NBSP}%", "Def 1v1 %"),
        (f"Offensive duels won,{NBSP}%", "Duels %"),
        (f"Aerial duels won,{NBSP}%", "Aerial %"),
        (f"Crosses per{NBSP}90", "Crosses /90"),
        (f"Successful dribbles,{NBSP}%", "Dribble %"),
        (f"Key passes per{NBSP}90", "Chances /90"),
        (f"xG{NBSP}per{NBSP}90", "xG /90"),
        (f"Fouls per{NBSP}90", "Fouls /90"),
    ],
    "DM": [
        (f"Accurate passes,{NBSP}%", "Pass Acc %"),
        (f"Defensive duels won,{NBSP}%", "Def Chall %"),
        (f"Successful defensive actions per{NBSP}90", "Ball Rec /90"),
        (f"Passes per{NBSP}90", "Passes /90"),
        (f"Accurate long passes,{NBSP}%", "Long Ball %"),
        (f"Aerial duels won,{NBSP}%", "Aerial %"),
        (f"Fouls per{NBSP}90", "Fouls /90"),
    ],
    "CM": [
        (f"Accurate passes,{NBSP}%", "Pass Acc %"),
        (f"Key passes per{NBSP}90", "Chances /90"),
        (f"Passes per{NBSP}90", "Passes /90"),
        (f"Defensive duels won,{NBSP}%", "Def Chall %"),
        (f"Successful defensive actions per{NBSP}90", "Ball Rec /90"),
        (f"Interceptions per{NBSP}90", "Intercept /90"),
    ],
    "AM": [
        (f"Key passes per{NBSP}90", "Chances /90"),
        (f"xG{NBSP}per{NBSP}90", "xG /90"),
        (f"Successful dribbles,{NBSP}%", "Dribble %"),
        (f"Progressive passes per{NBSP}90", "Prog Pass /90"),
        (f"Progressive runs per{NBSP}90", "Prog Runs /90"),
        (f"Shots on{NBSP}target,{NBSP}%", "SoT %"),
        (f"Passes to{NBSP}penalty area per{NBSP}90", "PA Pass /90"),
    ],
    "FW": [
        (f"xG{NBSP}per{NBSP}90", "xG /90"),
        (f"Goals per{NBSP}90", "Goals /90"),
        (f"Shots on{NBSP}target,{NBSP}%", "SoT %"),
        (f"Key passes per{NBSP}90", "Chances /90"),
        (f"Successful dribbles,{NBSP}%", "Dribble %"),
        (f"Crosses per{NBSP}90", "Crosses /90"),
        (f"Aerial duels won,{NBSP}%", "Aerial %"),
        (f"xA{NBSP}per{NBSP}90", "xA /90"),
    ],
}

# All-round metrics (used for all outfield)
ALLROUND_METRICS = [
    (f"Passes per{NBSP}90", "Passes /90"),
    (f"Accurate passes,{NBSP}%", "Pass Acc %"),
    (f"Progressive passes per{NBSP}90", "Prog Pass /90"),
    (f"Crosses per{NBSP}90", "Crosses /90"),
    (f"Offensive duels won,{NBSP}%", "Off Duels %"),
    (f"Defensive duels per{NBSP}90", "Def Duels /90"),
    (f"Aerial duels per{NBSP}90", "Aerial /90"),
    (f"Touches in{NBSP}box per{NBSP}90", "Box Touch /90"),
    (f"Fouls per{NBSP}90", "Fouls /90"),
    (f"Key passes per{NBSP}90", "Key Pass /90"),
]


def normalize_key(key: str) -> str:
    """Normalize metric key by replacing non-breaking spaces with regular ones."""
    return key.replace("\xa0", " ")


def percentile_rank(value: float, sorted_values: list[float], invert: bool = False) -> int:
    """Compute percentile rank (0-100) of a value within a sorted array."""
    n = len(sorted_values)
    if n == 0:
        return 50
    rank = 0
    for sv in sorted_values:
        if sv < value:
            rank += 1
        elif sv == value:
            rank += 0.5
    pct = round((rank / n) * 100)
    if invert:
        pct = 100 - pct
    return max(0, min(100, pct))


def parse_metric(val) -> float | None:
    """Parse a metric value to float."""
    if val is None or val == "" or val == "-":
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def get_all_metric_keys(position_group: str) -> list[tuple[str, str]]:
    """Get all metric keys relevant for a position group (position + allround)."""
    pos_metrics = POSITION_METRICS.get(position_group, [])
    return pos_metrics


def main():
    print("Loading matches data...")
    with open(MATCHES_PATH, "r") as f:
        matches = json.load(f)
    print(f"  Loaded {len(matches)} entries")

    # Step 1: Parse and filter players
    players = {}  # player_id → player data
    for entry in matches:
        tm = entry.get("transfermarkt")
        ws = entry.get("wyscout", {})

        if not tm:
            continue

        player_id = str(tm.get("player_id", ""))
        if not player_id:
            continue

        tm_pos = tm.get("position")
        pg = map_position(tm_pos)
        if not pg:
            continue

        matches_played = ws.get("matches", 0)
        minutes = ws.get("minutes", 0)
        if isinstance(matches_played, str):
            matches_played = int(matches_played) if matches_played else 0
        if isinstance(minutes, str):
            minutes = int(minutes) if minutes else 0

        # Filter: min 3 matches, 180 minutes
        if matches_played < 3 or minutes < 180:
            continue

        competition = ws.get("competition", "Unknown")
        raw_metrics = ws.get("metrics", {})

        # Parse all metrics to floats
        parsed = {}
        for k, v in raw_metrics.items():
            pv = parse_metric(v)
            if pv is not None:
                parsed[k] = pv

        players[player_id] = {
            "pg": pg,
            "comp": competition,
            "metrics": parsed,
            "name": tm.get("name", ""),
        }

    print(f"  Qualified players: {len(players)}")

    # Step 2: Group by position_group + competition, and position_group (global)
    # Collect sorted values for each metric
    league_values = defaultdict(lambda: defaultdict(list))  # (pg, comp) → metric_key → [values]
    global_values = defaultdict(lambda: defaultdict(list))  # pg → metric_key → [values]

    for pid, pdata in players.items():
        pg = pdata["pg"]
        comp = pdata["comp"]
        for mk, mv in pdata["metrics"].items():
            league_values[(pg, comp)][mk].append(mv)
            global_values[pg][mk].append(mv)

    # Sort the value arrays
    for key in league_values:
        for mk in league_values[key]:
            league_values[key][mk].sort()
    for pg in global_values:
        for mk in global_values[pg]:
            global_values[pg][mk].sort()

    print("  Sorted value arrays built")

    # Step 3: Compute percentiles for each player
    all_position_groups = list(POSITION_METRICS.keys())  # GK, CB, WB, DM, CM, AM, FW

    output = {}
    for pid, pdata in players.items():
        pg = pdata["pg"]
        comp = pdata["comp"]

        # --- Compute league & global percentiles for player's OWN position group ---
        p_league = {}     # normalized key → league percentile
        p_global = {}     # normalized key → global percentile

        for mk, mv in pdata["metrics"].items():
            norm_key = normalize_key(mk)
            is_inverted = mk in INVERTED_METRICS

            # League percentile (own position group)
            lv = league_values.get((pg, comp), {}).get(mk, [])
            p_league[norm_key] = percentile_rank(mv, lv, invert=is_inverted)

            # Global percentile (own position group)
            gv = global_values.get(pg, {}).get(mk, [])
            p_global[norm_key] = percentile_rank(mv, gv, invert=is_inverted)

        # Build position radar (natural position)
        pos_metrics_defs = POSITION_METRICS.get(pg, [])
        pos_radar = []
        for mk, label in pos_metrics_defs:
            norm_key = normalize_key(mk)
            raw = pdata["metrics"].get(mk)
            if raw is None:
                raw = 0
            pos_radar.append({
                "key": norm_key,
                "label": label,
                "value": round(raw, 2) if raw else 0,
                "percentile": p_league.get(norm_key, 50),
                "gp": p_global.get(norm_key, 50),
            })

        # Build allround radar (skip GK)
        allround_radar = []
        if pg != "GK":
            for mk, label in ALLROUND_METRICS:
                norm_key = normalize_key(mk)
                raw = pdata["metrics"].get(mk)
                if raw is None:
                    raw = 0
                allround_radar.append({
                    "key": norm_key,
                    "label": label,
                    "value": round(raw, 2) if raw else 0,
                    "percentile": p_league.get(norm_key, 50),
                    "gp": p_global.get(norm_key, 50),
                })

        # --- Compute templates: percentiles against ALL position pools ---
        templates = {}
        for tpg in all_position_groups:
            # Compute global percentiles for this player against the target position pool
            t_global = {}
            for mk, mv in pdata["metrics"].items():
                norm_key = normalize_key(mk)
                is_inverted = mk in INVERTED_METRICS
                gv = global_values.get(tpg, {}).get(mk, [])
                t_global[norm_key] = percentile_rank(mv, gv, invert=is_inverted)

            # Build position radar using template position's metrics
            t_pos_metrics_defs = POSITION_METRICS.get(tpg, [])
            t_radar = []
            for mk, label in t_pos_metrics_defs:
                norm_key = normalize_key(mk)
                raw = pdata["metrics"].get(mk)
                if raw is None:
                    raw = 0
                t_radar.append({
                    "key": norm_key,
                    "label": label,
                    "value": round(raw, 2) if raw else 0,
                    "percentile": t_global.get(norm_key, 50),
                    "gp": t_global.get(norm_key, 50),
                })

            # Build allround radar against this pool (skip GK pool for allround)
            t_allround = []
            if tpg != "GK":
                for mk, label in ALLROUND_METRICS:
                    norm_key = normalize_key(mk)
                    raw = pdata["metrics"].get(mk)
                    if raw is None:
                        raw = 0
                    t_allround.append({
                        "key": norm_key,
                        "label": label,
                        "value": round(raw, 2) if raw else 0,
                        "percentile": t_global.get(norm_key, 50),
                        "gp": t_global.get(norm_key, 50),
                    })

            templates[tpg] = {
                "radar": t_radar,
                "allround": t_allround,
            }

        output[pid] = {
            "pg": pg,
            "comp": comp,
            "radar": pos_radar,
            "allround": allround_radar,
            "templates": templates,
        }

    # Step 4: Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, separators=(",", ":"))

    file_size = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"  Output written to {OUTPUT_PATH} ({file_size:.1f} MB)")
    print(f"  Total players with percentiles: {len(output)}")

    # Stats
    pg_counts = defaultdict(int)
    for p in output.values():
        pg_counts[p["pg"]] += 1
    for pg, count in sorted(pg_counts.items()):
        print(f"    {pg}: {count}")


if __name__ == "__main__":
    main()

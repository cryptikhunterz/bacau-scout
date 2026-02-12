#!/usr/bin/env python3
"""
Regenerate wyscout-metrics.json and wyscout-percentiles.json from the
enrichment platform's matched data.

Source of truth: wyscout-enrichment/data/matched/matches.json
Outputs:
  - public/wyscout-metrics.json   (raw metrics per player)
  - public/wyscout-percentiles.json (position radar + allround with percentiles)

Usage:
  python3 scripts/regenerate-wyscout-from-enrichment.py
"""

import json
import os
import re
import sys
from collections import defaultdict

# ─── Paths ───────────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

MATCHES_PATH = os.path.join(
    PROJECT_DIR, "..", "wyscout-enrichment", "data", "matched", "matches.json"
)
METRICS_OUTPUT = os.path.join(PROJECT_DIR, "public", "wyscout-metrics.json")
PERCENTILES_OUTPUT = os.path.join(PROJECT_DIR, "public", "wyscout-percentiles.json")

NBSP = "\u00a0"  # non-breaking space used by Wyscout

# ─── Wyscout position → position group mapping ──────────────────────────────

WYSCOUT_POS_MAP = {
    # GK
    "GK": "GK",
    # CB
    "CB": "CB", "RCB": "CB", "LCB": "CB",
    # WB
    "LB": "WB", "RB": "WB", "LWB": "WB", "RWB": "WB", "RB5": "WB", "LB5": "WB",
    # DM
    "DMF": "DM", "LDMF": "DM", "RDMF": "DM",
    # CM
    "CMF": "CM", "LCMF": "CM", "RCMF": "CM",
    # AM
    "AMF": "AM", "LAMF": "AM", "RAMF": "AM",
    "LW": "AM", "RW": "AM", "LMF": "AM", "RMF": "AM", "LMFR": "AM",
    # FW
    "CF": "FW", "ST": "FW", "SS": "FW", "LWF": "FW", "RWF": "FW", "LCMF3": "FW",
}

# Transfermarkt position fallback (used when Wyscout position can't be parsed)
TM_POS_MAP = {
    "goalkeeper": "GK",
    "centre-back": "CB",
    "defender - centre-back": "CB",
    "defender": "CB",
    "left-back": "WB",
    "right-back": "WB",
    "defender - left-back": "WB",
    "defender - right-back": "WB",
    "defensive midfield": "DM",
    "midfield - defensive midfield": "DM",
    "central midfield": "CM",
    "midfield - central midfield": "CM",
    "midfielder": "CM",
    "attacking midfield": "AM",
    "midfield - attacking midfield": "AM",
    "left midfield": "AM",
    "right midfield": "AM",
    "left winger": "AM",
    "right winger": "AM",
    "attack - left winger": "AM",
    "attack - right winger": "AM",
    "second striker": "FW",
    "striker": "FW",
    "centre-forward": "FW",
    "attack - centre-forward": "FW",
}


KNOWN_WS_POSITIONS = set(WYSCOUT_POS_MAP.keys())


def extract_primary_wyscout_position(pos_str: str) -> str | None:
    """
    Extract the primary position from Wyscout's position string.

    The format is typically:
      "POS1, POS2POS1 (X%)POS2 (Y%)"  — comma-separated list then percentage breakdown
      "LCBLCB (89%)"                   — single position repeated with percentage
      "GK"                             — just a position code

    Examples:
      "DMF, RDMFDMF (69%)RDMF (11%)" → "DMF"
      "LCBLCB (89%)"                  → "LCB"
      "CF, LWF, LWCF (43%)LWF (29%)" → "CF"
      "GK"                            → "GK"
    """
    if not pos_str:
        return None

    pos_str = pos_str.strip()

    # Strategy 1: Take first comma-separated part, match against known positions
    # This handles "LCBLCB (89%)" by checking prefixes against known positions
    parts = [p.strip() for p in pos_str.split(",")]
    first = parts[0]
    # Try progressively shorter prefixes against known positions (longest match wins)
    for length in range(min(6, len(first)), 0, -1):
        candidate = first[:length]
        if candidate in KNOWN_WS_POSITIONS:
            return candidate

    # Strategy 2: Find positions with percentage annotations, pick highest %
    pct_matches = re.findall(r'([A-Z][A-Z0-9]{1,5})\s*\((\d+)%\)', pos_str)
    if pct_matches:
        # Prefer known positions
        valid = [(p, int(pct)) for p, pct in pct_matches if p in KNOWN_WS_POSITIONS]
        if valid:
            return max(valid, key=lambda x: x[1])[0]
        return max(pct_matches, key=lambda x: int(x[1]))[0]

    # Strategy 3: First uppercase token
    m = re.match(r'^([A-Z][A-Z0-9]+)', first)
    return m.group(1) if m else None


def map_position(ws_pos_str: str, tm_pos_str: str) -> str | None:
    """Map to position group using Wyscout position first, TM position as fallback."""
    # Try Wyscout position
    primary = extract_primary_wyscout_position(ws_pos_str)
    if primary and primary in WYSCOUT_POS_MAP:
        return WYSCOUT_POS_MAP[primary]

    # Fallback to Transfermarkt position
    if tm_pos_str:
        p = tm_pos_str.lower().strip()
        if p in TM_POS_MAP:
            return TM_POS_MAP[p]
        # Heuristic fallbacks
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
        if "winger" in p or "wing" in p:
            return "AM"
        if "midfield" in p:
            return "CM"
        if "forward" in p or "striker" in p:
            return "FW"
        if "defen" in p or "back" in p:
            return "CB"

    return "CM"  # ultimate fallback


def normalize_key(key: str) -> str:
    """Replace non-breaking spaces with regular spaces."""
    return key.replace(NBSP, " ")


def parse_metric(val) -> float | None:
    """Parse a metric value to float."""
    if val is None or val == "" or val == "-":
        return None
    try:
        return float(str(val))
    except (ValueError, TypeError):
        return None


# ─── Radar metric definitions ───────────────────────────────────────────────
# These MUST match what the frontend expects (wyscoutRadar.ts uses regular spaces,
# but enrichment data has \xa0). We store with \xa0 for lookup, normalize on output.

# Inverted metrics: lower is better
INVERTED_METRICS = {f"Fouls per{NBSP}90"}

# Position-specific radar metrics: (wyscout_key_with_nbsp, display_label)
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

# All-round metrics (all outfield players)
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


# ─── Percentile computation ─────────────────────────────────────────────────

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


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print(f"📂 Reading enrichment data: {os.path.abspath(MATCHES_PATH)}")
    with open(MATCHES_PATH, "r", encoding="utf-8") as f:
        matches = json.load(f)
    print(f"   Total entries in matches.json: {len(matches)}")

    # ── Step 1: Parse all players ────────────────────────────────────────────

    MIN_MATCHES = 3
    MIN_MINUTES = 180

    players = {}       # player_id → player data
    metrics_out = {}   # player_id → wyscout-metrics.json entry
    skipped_no_id = 0
    skipped_no_metrics = 0
    skipped_low_minutes = 0
    position_unmapped = []

    for entry in matches:
        tm = entry.get("transfermarkt") or {}
        ws = entry.get("wyscout") or {}

        player_id = tm.get("player_id")
        if not player_id:
            skipped_no_id += 1
            continue

        player_id = str(player_id)

        raw_metrics = ws.get("metrics", {})
        if not raw_metrics:
            skipped_no_metrics += 1
            continue

        # Parse metrics
        parsed = {}
        for k, v in raw_metrics.items():
            pv = parse_metric(v)
            if pv is not None:
                parsed[k] = pv

        # Build wyscout-metrics.json entry (all players with metrics, no filtering)
        normalized_metrics = {normalize_key(k): str(v) for k, v in raw_metrics.items()}
        ws_position = ws.get("position", "")
        tm_position = tm.get("position", "")

        metrics_out[player_id] = {
            "metrics": normalized_metrics,
            "position": tm_position,
            "wyscoutPosition": ws_position,
        }

        # Map position group (prefer Wyscout position)
        pg = map_position(ws_position, tm_position)
        if not pg:
            position_unmapped.append((player_id, ws_position, tm_position))
            continue

        # Filter for percentiles: minimum matches and minutes
        matches_played = ws.get("matches", 0)
        minutes = ws.get("minutes", 0)
        if isinstance(matches_played, str):
            matches_played = int(matches_played) if matches_played else 0
        if isinstance(minutes, str):
            minutes = int(minutes) if minutes else 0

        if matches_played < MIN_MATCHES or minutes < MIN_MINUTES:
            skipped_low_minutes += 1
            continue

        competition = ws.get("competition", "Unknown")

        players[player_id] = {
            "pg": pg,
            "comp": competition,
            "metrics": parsed,  # with NBSP keys for lookup
            "name": tm.get("name", ""),
        }

    print(f"\n📊 Parsing results:")
    print(f"   Players with metrics (wyscout-metrics.json): {len(metrics_out)}")
    print(f"   Players qualifying for percentiles (≥{MIN_MATCHES} matches, ≥{MIN_MINUTES} min): {len(players)}")
    print(f"   Skipped - no TM ID: {skipped_no_id}")
    print(f"   Skipped - no metrics: {skipped_no_metrics}")
    print(f"   Skipped - low minutes: {skipped_low_minutes}")
    if position_unmapped:
        print(f"   ⚠️  Unmapped positions: {len(position_unmapped)}")
        for pid, wsp, tmp in position_unmapped[:5]:
            print(f"      {pid}: ws='{wsp}' tm='{tmp}'")

    # ── Step 2: Write wyscout-metrics.json ───────────────────────────────────

    os.makedirs(os.path.dirname(METRICS_OUTPUT), exist_ok=True)
    with open(METRICS_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(metrics_out, f, ensure_ascii=False)

    ms = os.path.getsize(METRICS_OUTPUT) / (1024 * 1024)
    print(f"\n✅ wyscout-metrics.json: {len(metrics_out)} players ({ms:.1f} MB)")

    # ── Step 3: Build percentile distributions ───────────────────────────────

    league_values = defaultdict(lambda: defaultdict(list))  # (pg, comp) → metric → [values]
    global_values = defaultdict(lambda: defaultdict(list))  # pg → metric → [values]

    for pid, pdata in players.items():
        pg = pdata["pg"]
        comp = pdata["comp"]
        for mk, mv in pdata["metrics"].items():
            league_values[(pg, comp)][mk].append(mv)
            global_values[pg][mk].append(mv)

    # Sort for percentile computation
    for key in league_values:
        for mk in league_values[key]:
            league_values[key][mk].sort()
    for pg in global_values:
        for mk in global_values[pg]:
            global_values[pg][mk].sort()

    # ── Step 4: Compute percentiles and build output ─────────────────────────

    percentile_out = {}
    missing_metrics_log = defaultdict(int)

    for pid, pdata in players.items():
        pg = pdata["pg"]
        comp = pdata["comp"]

        # Compute percentiles for ALL metrics this player has
        p_league = {}
        p_global = {}
        for mk, mv in pdata["metrics"].items():
            norm_key = normalize_key(mk)
            is_inverted = mk in INVERTED_METRICS

            lv = league_values.get((pg, comp), {}).get(mk, [])
            p_league[norm_key] = percentile_rank(mv, lv, invert=is_inverted)

            gv = global_values.get(pg, {}).get(mk, [])
            p_global[norm_key] = percentile_rank(mv, gv, invert=is_inverted)

        # Build position radar
        pos_defs = POSITION_METRICS.get(pg, [])
        pos_radar = []
        for mk_nbsp, label in pos_defs:
            norm_key = normalize_key(mk_nbsp)
            raw = pdata["metrics"].get(mk_nbsp)
            if raw is None:
                missing_metrics_log[norm_key] += 1
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
            for mk_nbsp, label in ALLROUND_METRICS:
                norm_key = normalize_key(mk_nbsp)
                raw = pdata["metrics"].get(mk_nbsp)
                if raw is None:
                    missing_metrics_log[norm_key] += 1
                    raw = 0
                allround_radar.append({
                    "key": norm_key,
                    "label": label,
                    "value": round(raw, 2) if raw else 0,
                    "percentile": p_league.get(norm_key, 50),
                    "gp": p_global.get(norm_key, 50),
                })

        percentile_out[pid] = {
            "pg": pg,
            "comp": comp,
            "radar": pos_radar,
            "allround": allround_radar,
        }

    with open(PERCENTILES_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(percentile_out, f, separators=(",", ":"))

    ps = os.path.getsize(PERCENTILES_OUTPUT) / (1024 * 1024)
    print(f"✅ wyscout-percentiles.json: {len(percentile_out)} players ({ps:.1f} MB)")

    # ── Step 5: Metric coverage check ────────────────────────────────────────

    if missing_metrics_log:
        print(f"\n⚠️  Missing radar metrics (player didn't have the metric):")
        for mk, count in sorted(missing_metrics_log.items(), key=lambda x: -x[1]):
            print(f"   {mk}: {count} players missing")

    # ── Step 6: Cross-check with wyscoutRadar.ts expected keys ───────────────

    ts_radar_keys = {
        # CB_METRICS
        "Defensive duels per 90", "Defensive duels won, %", "Aerial duels per 90",
        "Aerial duels won, %", "Interceptions per 90", "Shots blocked per 90",
        "Fouls per 90", "Sliding tackles per 90",
        # MID_METRICS
        "Passes per 90", "Accurate passes, %", "Progressive passes per 90",
        "Forward passes per 90", "Key passes per 90", "Defensive duels per 90",
        "Interceptions per 90", "Successful dribbles, %",
        # WINGER_METRICS
        "Crosses per 90", "Dribbles per 90", "Successful dribbles, %",
        "Offensive duels per 90", "Offensive duels won, %", "Key passes per 90",
        "Shots per 90", "xG per 90",
        # FORWARD_METRICS
        "Goals", "Shots per 90", "Shots on target, %", "xG",
        "Offensive duels per 90", "Offensive duels won, %", "Touches in box per 90",
        "Aerial duels won, %",
        # OVERALL_METRICS
        "Passes per 90", "Accurate passes, %", "Progressive passes per 90",
        "Crosses per 90", "Offensive duels won, %", "Defensive duels per 90",
        "Aerial duels per 90", "Touches in box per 90", "Fouls per 90", "Key passes per 90",
    }

    # Collect all normalized metric keys that exist in the data
    all_data_keys = set()
    for pdata in players.values():
        for k in pdata["metrics"]:
            all_data_keys.add(normalize_key(k))

    missing_from_data = ts_radar_keys - all_data_keys
    if missing_from_data:
        print(f"\n❌ wyscoutRadar.ts keys NOT found in enrichment data:")
        for k in sorted(missing_from_data):
            print(f"   {k}")
    else:
        print(f"\n✅ All wyscoutRadar.ts metric keys found in enrichment data")

    # ── Step 7: Stats ────────────────────────────────────────────────────────

    pg_counts = defaultdict(int)
    comp_counts = defaultdict(int)
    for p in percentile_out.values():
        pg_counts[p["pg"]] += 1
        comp_counts[p["comp"]] += 1

    print(f"\n📈 Position group breakdown:")
    for pg, count in sorted(pg_counts.items()):
        print(f"   {pg}: {count}")

    print(f"\n🏆 Top 15 leagues by player count:")
    for comp, count in sorted(comp_counts.items(), key=lambda x: -x[1])[:15]:
        print(f"   {comp}: {count}")

    # ── Step 8: Verification of specific players ─────────────────────────────

    print(f"\n🔍 Verification:")

    # Chirilă (1073380)
    if "1073380" in percentile_out:
        p = percentile_out["1073380"]
        nonzero = sum(1 for m in p["radar"] if m["value"] != 0)
        print(f"   Chirilă (1073380): pg={p['pg']}, comp={p['comp']}")
        print(f"     Radar: {len(p['radar'])} metrics, {nonzero} non-zero")
        for m in p["radar"][:4]:
            print(f"       {m['key']}: val={m['value']}, league={m['percentile']}, global={m['gp']}")
    else:
        print(f"   Chirilă (1073380): NOT in percentile output (may not meet min minutes)")

    if "1073380" in metrics_out:
        mk = metrics_out["1073380"]["metrics"]
        nonzero = sum(1 for v in mk.values() if parse_metric(v) and parse_metric(v) != 0)
        print(f"     Raw metrics: {len(mk)} total, {nonzero} non-zero")

    print()

    # Cruceru (315448)
    if "315448" in percentile_out:
        p = percentile_out["315448"]
        nonzero = sum(1 for m in p["radar"] if m["value"] != 0)
        print(f"   Cruceru (315448): pg={p['pg']}, comp={p['comp']}")
        print(f"     Radar: {len(p['radar'])} metrics, {nonzero} non-zero")
        for m in p["radar"][:4]:
            print(f"       {m['key']}: val={m['value']}, league={m['percentile']}, global={m['gp']}")
        for m in p["allround"][:3]:
            print(f"       (allround) {m['key']}: val={m['value']}, league={m['percentile']}, global={m['gp']}")
    else:
        print(f"   Cruceru (315448): NOT in percentile output")

    print(f"\n✨ Done!")


if __name__ == "__main__":
    main()

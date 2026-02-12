#!/usr/bin/env python3
"""
Sync Wyscout data from the enrichment platform's chunked data.
Uses player-index.json + chunks/ which have correct TM PIDs, 
metrics, league/global percentiles, and radar configs.

DYNAMIC approach: no hardcoded metric lists. Each player gets:
- radar[]: position-specific metrics from enrichment's `r` config, 
  or dynamically built from ALL metrics (position keys first) if `r` < 5
- allround[]: ALL remaining metrics with percentiles (not in radar)
"""
import json, os, glob

ENRICHMENT_DIR = "/Users/majorwinters/.openclaw/workspace/projects/wyscout-enrichment/frontend/public/data"
OUTPUT_DIR = "/Users/majorwinters/.openclaw/workspace/projects/bacau-scout/public"


def format_label(key):
    """Format a metric key into a short readable label (like enrichment frontend)."""
    return (key
        .replace(" per 90", " /90")
        .replace(", %", " %")
        .replace("Successful ", ""))


# Load player index (maps internal id -> chunk number)
with open(os.path.join(ENRICHMENT_DIR, "player-index.json")) as f:
    player_index = json.load(f)

# Load all chunks
all_players = {}
chunk_dir = os.path.join(ENRICHMENT_DIR, "chunks")
for chunk_file in sorted(glob.glob(os.path.join(chunk_dir, "*.json"))):
    with open(chunk_file) as f:
        chunk = json.load(f)
    for internal_id, player in chunk.items():
        all_players[internal_id] = player

print(f"Loaded {len(all_players)} players from enrichment chunks")

# Build metrics and percentiles keyed by TM PID
wyscout_metrics = {}
wyscout_percentiles = {}

no_pid = 0
has_pid = 0

for internal_id, p in all_players.items():
    pid = p.get("pid")
    if not pid:
        no_pid += 1
        continue
    has_pid += 1
    
    pid = str(pid)
    
    # Build metrics file entry
    metrics_entry = {
        "name": p.get("n"),
        "club": p.get("cl"),
        "position": p.get("pos"),
        "pg": p.get("pg"),
        "comp": p.get("comp"),
        "age": p.get("age"),
        "minutes": p.get("min"),
        "matches": p.get("mp"),
        "metrics": p.get("m", {})
    }
    wyscout_metrics[pid] = metrics_entry
    
    # Build percentiles file entry (need min 3 matches, 180 min)
    if (p.get("mp", 0) or 0) >= 3 and (p.get("min", 0) or 0) >= 180:
        league_p = p.get("p", {}) or {}
        global_p = p.get("gp", {}) or {}
        metrics = p.get("m", {}) or {}
        radar_config = p.get("r", []) or []
        
        # Position-specific radar keys from enrichment config
        pos_keys = [rm.get("key", "") for rm in radar_config]
        
        # === DYNAMIC APPROACH (like enrichment frontend) ===
        # Build ALL metrics with percentiles
        all_metric_entries = []
        for key in metrics.keys():
            lp_val = league_p.get(key)
            gp_val = global_p.get(key)
            if lp_val is None and gp_val is None:
                continue
            all_metric_entries.append({
                "key": key,
                "label": format_label(key),
                "value": metrics.get(key, 0),
                "percentile": lp_val,
                "gp": gp_val,
                "invert": False
            })
        
        # Sort: position-specific keys first, then rest
        def sort_key(entry):
            in_pos = 0 if entry["key"] in pos_keys else 1
            return (in_pos, entry["key"])
        
        all_metric_entries.sort(key=sort_key)
        
        # === Build radar array ===
        # If enrichment has >= 5 position-specific metrics in `r`, use those for radar
        # Otherwise, take first 16 from all_metric_entries (position keys first)
        if len(radar_config) >= 5:
            radar_metrics = []
            for rm in radar_config:
                key = rm.get("key", "")
                radar_metrics.append({
                    "key": key,
                    "label": rm.get("label", format_label(key)),
                    "value": rm.get("value", metrics.get(key, 0)),
                    "percentile": league_p.get(key),
                    "gp": global_p.get(key),
                    "invert": rm.get("invert", False)
                })
        else:
            # Dynamic: take up to 16 from all metrics (position keys prioritized)
            radar_metrics = []
            for entry in all_metric_entries:
                radar_metrics.append(entry)
                if len(radar_metrics) >= 16:
                    break
        
        # === Build allround array ===
        # ALL remaining metrics not in radar (no cap — let the frontend decide how many to show)
        radar_key_set = {m["key"] for m in radar_metrics}
        allround_metrics = [
            entry for entry in all_metric_entries 
            if entry["key"] not in radar_key_set
        ]
        
        # If allround is too small (<3) and radar is large, move some from radar
        if len(allround_metrics) < 3 and len(radar_metrics) > 6:
            while len(allround_metrics) < 5 and len(radar_metrics) > 6:
                moved = radar_metrics.pop()
                allround_metrics.insert(0, moved)
        
        # If radar is too small (<3), try to fill from allround
        if len(radar_metrics) < 3 and len(allround_metrics) > 0:
            while len(radar_metrics) < 3 and len(allround_metrics) > 0:
                radar_metrics.append(allround_metrics.pop(0))
        
        pctl_entry = {
            "name": p.get("n"),
            "pg": p.get("pg"),
            "comp": p.get("comp"),
            "radar": radar_metrics,
            "allround": allround_metrics
        }
        wyscout_percentiles[pid] = pctl_entry

# Stats
print(f"With PID: {has_pid}, Without PID: {no_pid}")
print(f"Metrics file: {len(wyscout_metrics)} players")
print(f"Percentiles file: {len(wyscout_percentiles)} players")

# Verify key players
for check_pid, check_name in [("940237", "Cîrstean"), ("548417", "Ionuț Chirilă"), ("315448", "Cruceru"), ("495622", "Moukhliss")]:
    if check_pid in wyscout_percentiles:
        p = wyscout_percentiles[check_pid]
        radar_count = len(p.get("radar", []))
        allround_count = len(p.get("allround", []))
        has_league = any(m.get("percentile") is not None for m in p.get("radar", []))
        print(f"✅ {check_name} ({check_pid}): pg={p['pg']}, comp={p['comp']}, radar={radar_count}, allround={allround_count}, league_p={'yes' if has_league else 'no'}")
    elif check_pid in wyscout_metrics:
        m = wyscout_metrics[check_pid]
        print(f"⚠️ {check_name} ({check_pid}): in metrics only (pg={m['pg']}, {m['matches']} matches, {m['minutes']} min)")
    else:
        print(f"❌ {check_name} ({check_pid}): NOT FOUND")

# Position group distribution
pg_counts = {}
for p in wyscout_percentiles.values():
    pg = p.get("pg", "?")
    pg_counts[pg] = pg_counts.get(pg, 0) + 1
print(f"\nPosition groups: {dict(sorted(pg_counts.items()))}")

# Write output
with open(os.path.join(OUTPUT_DIR, "wyscout-metrics.json"), "w") as f:
    json.dump(wyscout_metrics, f)
print(f"\nWrote wyscout-metrics.json ({len(wyscout_metrics)} players)")

with open(os.path.join(OUTPUT_DIR, "wyscout-percentiles.json"), "w") as f:
    json.dump(wyscout_percentiles, f)
print(f"Wrote wyscout-percentiles.json ({len(wyscout_percentiles)} players)")

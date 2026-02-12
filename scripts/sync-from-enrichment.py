#!/usr/bin/env python3
"""
Sync Wyscout data from the enrichment platform's chunked data.
Uses player-index.json + chunks/ which have correct TM PIDs, 
metrics, league/global percentiles, and radar configs.
"""
import json, os, glob

ENRICHMENT_DIR = "/Users/majorwinters/.openclaw/workspace/projects/wyscout-enrichment/frontend/public/data"
OUTPUT_DIR = "/Users/majorwinters/.openclaw/workspace/projects/bacau-scout/public"

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
        # Build radar array from enrichment's radar config
        radar_metrics = []
        allround_metrics = []
        
        league_p = p.get("p", {}) or {}
        global_p = p.get("gp", {}) or {}
        metrics = p.get("m", {}) or {}
        radar_config = p.get("r", []) or []
        
        # Position-specific radar from enrichment platform's config
        for rm in radar_config:
            key = rm.get("key", "")
            radar_metrics.append({
                "key": key,
                "label": rm.get("label", key),
                "value": rm.get("value", 0),
                "percentile": league_p.get(key),
                "gp": global_p.get(key),
                "invert": rm.get("invert", False)
            })
        
        # All-round metrics: use all available metric percentiles
        # Pick top 10 non-radar metrics for allround, or use standard set
        ALLROUND_KEYS = [
            "Passes per 90", "Accurate passes, %", "Progressive passes per 90",
            "Crosses per 90", "Offensive duels won, %", "Defensive duels per 90",
            "Aerial duels per 90", "Touches in box per 90", "Fouls per 90",
            "Key passes per 90"
        ]
        
        for key in ALLROUND_KEYS:
            if key in metrics:
                allround_metrics.append({
                    "key": key,
                    "label": key,
                    "value": metrics.get(key, 0),
                    "percentile": league_p.get(key),
                    "gp": global_p.get(key)
                })
        
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
for check_pid, check_name in [("548417", "Ionuț Chirilă"), ("315448", "Cruceru"), ("1073380", "Andrei Chirilă")]:
    if check_pid in wyscout_percentiles:
        p = wyscout_percentiles[check_pid]
        radar_count = len(p.get("radar", []))
        has_league = any(m.get("percentile") is not None for m in p.get("radar", []))
        print(f"✅ {check_name} ({check_pid}): pg={p['pg']}, comp={p['comp']}, radar={radar_count} metrics, league_p={'yes' if has_league else 'no'}")
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

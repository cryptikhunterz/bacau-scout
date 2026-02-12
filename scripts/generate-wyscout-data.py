#!/usr/bin/env python3
"""
Generate public/wyscout-metrics.json from the matched players dataset.

Input:  wyscout-enrichment/data/matched/matches.json
Output: public/wyscout-metrics.json

Structure: { "<player_id>": { "metrics": {...}, "position": "..." }, ... }
Only includes players that have a transfermarkt.player_id.
"""

import json
import os
import re

MATCHES_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "..", "wyscout-enrichment", "data", "matched", "matches.json",
)
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "wyscout-metrics.json")


def normalize_key(key: str) -> str:
    """Replace non-breaking spaces with regular spaces."""
    return key.replace("\u00a0", " ")


def main():
    print(f"Reading {os.path.abspath(MATCHES_PATH)}...")
    with open(MATCHES_PATH, "r", encoding="utf-8") as f:
        matches = json.load(f)

    print(f"Total matches: {len(matches)}")

    result = {}
    skipped = 0

    for entry in matches:
        tm = entry.get("transfermarkt") or {}
        ws = entry.get("wyscout") or {}

        player_id = tm.get("player_id")
        if not player_id:
            skipped += 1
            continue

        raw_metrics = ws.get("metrics", {})
        if not raw_metrics:
            skipped += 1
            continue

        # Normalize metric keys (replace non-breaking spaces)
        metrics = {normalize_key(k): v for k, v in raw_metrics.items()}

        # Use Transfermarkt position as primary (more standardized)
        position = tm.get("position", ws.get("position", ""))

        result[str(player_id)] = {
            "metrics": metrics,
            "position": position,
            "wyscoutPosition": ws.get("position", ""),
        }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    file_size = os.path.getsize(OUTPUT_PATH)
    print(f"Written {len(result)} players to {os.path.abspath(OUTPUT_PATH)}")
    print(f"Skipped {skipped} entries (no player_id or no metrics)")
    print(f"File size: {file_size / (1024 * 1024):.1f} MB")


if __name__ == "__main__":
    main()

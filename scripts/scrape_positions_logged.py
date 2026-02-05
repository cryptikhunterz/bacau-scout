#!/usr/bin/env python3
"""
Position scraper with full activity logging
Logs to: logs/position_scrape.log
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os
from datetime import datetime

# Setup logging
LOG_DIR = 'logs'
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = f'{LOG_DIR}/position_scrape.log'

def log(msg):
    """Log to file and print"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f"[{timestamp}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}

VALID_POSITIONS = ['Goalkeeper', 'Defender', 'Midfield', 'Attack', 'Forward', 
    'Centre-Back', 'Left-Back', 'Right-Back', 'Central Midfield', 
    'Defensive Midfield', 'Attacking Midfield', 'Left Winger', 'Right Winger', 
    'Centre-Forward', 'Second Striker', 'Sweeper']

def is_valid(pos):
    return pos and any(vp.lower() in pos.lower() for vp in VALID_POSITIONS)

def get_position(url):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code == 429:
            log(f"  RATE LIMITED - waiting 60s")
            time.sleep(60)
            return get_position(url)  # retry
        if resp.status_code != 200:
            return None, f"HTTP {resp.status_code}"
        
        soup = BeautifulSoup(resp.text, 'lxml')
        pos_span = soup.select_one('.detail-position__position')
        if pos_span:
            pos = pos_span.get_text(strip=True)
            if is_valid(pos):
                return pos, None
        return None, "Position not found"
    except Exception as e:
        return None, str(e)

# Load players
log("=" * 60)
log("POSITION SCRAPER STARTED")
log("=" * 60)

with open('public/players.json') as f:
    players = json.load(f)

missing = [(i, p) for i, p in enumerate(players) if not p.get('position') and p.get('profile_url')]
total = len(missing)
log(f"Total players: {len(players)}")
log(f"Missing positions: {total}")
log(f"Estimated time: {total * 0.25 / 60:.1f} minutes")
log("-" * 60)

fixed = 0
errors = 0
start_time = time.time()

for count, (idx, p) in enumerate(missing, 1):
    pos, err = get_position(p['profile_url'])
    
    if pos:
        players[idx]['position'] = pos
        fixed += 1
        log(f"[{count}/{total}] ✓ {p['name']}: {pos}")
    else:
        errors += 1
        log(f"[{count}/{total}] ✗ {p['name']}: {err}")
    
    # Save every 50 players
    if count % 50 == 0:
        elapsed = time.time() - start_time
        rate = count / elapsed * 60  # per minute
        remaining = (total - count) / rate if rate > 0 else 0
        log(f"--- PROGRESS: {count}/{total} | Fixed: {fixed} | Errors: {errors} | Rate: {rate:.1f}/min | ETA: {remaining:.1f} min ---")
        with open('public/players.json', 'w') as f:
            json.dump(players, f)
        log(f"--- Saved to players.json ---")
    
    time.sleep(0.2 + random.random() * 0.1)

# Final save
with open('public/players.json', 'w') as f:
    json.dump(players, f)

elapsed = time.time() - start_time
log("=" * 60)
log(f"SCRAPE COMPLETE")
log(f"Fixed: {fixed}/{total} positions")
log(f"Errors: {errors}")
log(f"Time: {elapsed/60:.1f} minutes")
log("=" * 60)

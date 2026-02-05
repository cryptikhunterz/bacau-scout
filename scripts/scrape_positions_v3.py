#!/usr/bin/env python3
"""
Position scraper v3 - uses meta description which is more reliable
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os
from datetime import datetime

LOG_DIR = 'logs'
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = f'{LOG_DIR}/position_scrape.log'

def log(msg):
    timestamp = datetime.now().strftime('%H:%M:%S')
    line = f"[{timestamp}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}

VALID_POSITIONS = ['Goalkeeper', 'Defender', 'Midfield', 'Attack', 'Forward', 
    'Centre-Back', 'Left-Back', 'Right-Back', 'Central Midfield', 
    'Defensive Midfield', 'Attacking Midfield', 'Left Winger', 'Right Winger', 
    'Centre-Forward', 'Second Striker', 'Striker', 'Midfielder']

def is_valid(pos):
    return pos and any(vp.lower() in pos.lower() for vp in VALID_POSITIONS)

def get_position(url):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code == 429:
            log("  RATE LIMITED - waiting 60s")
            time.sleep(60)
            return get_position(url)
        if resp.status_code != 200:
            return None, f"HTTP {resp.status_code}"
        
        soup = BeautifulSoup(resp.text, 'lxml')
        
        # Method 1: Meta description (most reliable)
        # Format: "Name, age, from Country ... Club ... Position ..."
        meta = soup.find('meta', {'name': 'description'})
        if meta:
            content = meta.get('content', '')
            # Split by the arrow character
            for pos in VALID_POSITIONS:
                if pos in content:
                    return pos, None
        
        # Method 2: detail-position class
        pos_span = soup.select_one('.detail-position__position')
        if pos_span:
            pos = pos_span.get_text(strip=True)
            if is_valid(pos):
                return pos, None
        
        return None, "Not found"
    except Exception as e:
        return None, str(e)[:30]

# Load
log("=" * 50)
log("POSITION SCRAPER v3 STARTED")
with open('public/players.json') as f:
    players = json.load(f)

missing = [(i, p) for i, p in enumerate(players) if not p.get('position') and p.get('profile_url')]
total = len(missing)
log(f"Missing: {total} | ETA: {total*0.25/60:.0f} min")
log("=" * 50)

fixed = errors = 0
start = time.time()

for count, (idx, p) in enumerate(missing, 1):
    pos, err = get_position(p['profile_url'])
    
    if pos:
        players[idx]['position'] = pos
        fixed += 1
        log(f"OK [{count}] {p['name'][:20]}: {pos}")
    else:
        errors += 1
        if count <= 20 or count % 100 == 0:
            log(f"FAIL [{count}] {p['name'][:20]}: {err}")
    
    if count % 100 == 0:
        rate = count / (time.time() - start) * 60
        eta = (total - count) / rate if rate > 0 else 0
        log(f"--- {count}/{total} | OK:{fixed} FAIL:{errors} | {rate:.0f}/min | ETA {eta:.0f}m ---")
        with open('public/players.json', 'w') as f:
            json.dump(players, f)
    
    time.sleep(0.2 + random.random() * 0.1)

with open('public/players.json', 'w') as f:
    json.dump(players, f)
log(f"DONE! Fixed {fixed}/{total} in {(time.time()-start)/60:.1f}m")

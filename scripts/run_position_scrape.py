#!/usr/bin/env python3
"""Run position scrape on all players missing positions"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}

VALID_POSITIONS = ['Goalkeeper', 'Defender', 'Midfield', 'Attack', 'Forward', 
    'Centre-Back', 'Left-Back', 'Right-Back', 'Central Midfield', 
    'Defensive Midfield', 'Attacking Midfield', 'Left Winger', 'Right Winger', 
    'Centre-Forward', 'Second Striker']

def is_valid(pos):
    return pos and any(vp.lower() in pos.lower() for vp in VALID_POSITIONS)

def get_position(url):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, 'lxml')
        
        # Try detail-position class
        pos_span = soup.select_one('.detail-position__position')
        if pos_span:
            pos = pos_span.get_text(strip=True)
            if is_valid(pos):
                return pos
        return None
    except:
        return None

# Load players
with open('public/players.json') as f:
    players = json.load(f)

missing = [p for p in players if not p.get('position') and p.get('profile_url')]
print(f"Players needing positions: {len(missing)}")

fixed = 0
for i, p in enumerate(missing):
    pos = get_position(p['profile_url'])
    if pos:
        p['position'] = pos
        fixed += 1
    
    if (i+1) % 100 == 0:
        print(f"Progress: {i+1}/{len(missing)} ({fixed} fixed)")
        with open('public/players.json', 'w') as f:
            json.dump(players, f)
    
    time.sleep(0.15 + random.random() * 0.1)

# Final save
with open('public/players.json', 'w') as f:
    json.dump(players, f)
print(f"\nDone! Fixed {fixed} positions out of {len(missing)}")

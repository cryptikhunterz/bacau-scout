#!/usr/bin/env python3
"""Quick position fix - scrape positions from player profiles"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml',
}

def get_position(profile_url):
    """Get position from player profile page"""
    try:
        resp = requests.get(profile_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, 'lxml')
        
        # Look for position in player data
        pos_label = soup.find('span', string='Position:')
        if pos_label:
            pos_val = pos_label.find_next('span')
            if pos_val:
                return pos_val.get_text(strip=True)
        
        # Alt: look in info table
        for li in soup.select('li.data-header__label'):
            if 'position' in li.get_text().lower():
                val = li.find('span')
                if val:
                    return val.get_text(strip=True)
        
        return None
    except Exception as e:
        return None

# Load players
with open('public/players.json') as f:
    players = json.load(f)

# Find players without positions
missing = [p for p in players if not p.get('position')]
print(f"Players missing positions: {len(missing)}")

# Scrape first 500 (most important)
fixed = 0
for i, p in enumerate(missing[:500]):
    url = p.get('profile_url')
    if not url:
        continue
    
    pos = get_position(url)
    if pos:
        p['position'] = pos
        fixed += 1
        print(f"[{i+1}/500] {p['name']}: {pos}")
    else:
        print(f"[{i+1}/500] {p['name']}: failed")
    
    time.sleep(0.3 + random.random() * 0.2)
    
    # Save progress every 50
    if (i+1) % 50 == 0:
        with open('public/players.json', 'w') as f:
            json.dump(players, f)
        print(f"  Saved! ({fixed} fixed so far)")

# Final save
with open('public/players.json', 'w') as f:
    json.dump(players, f)
print(f"\nDone! Fixed {fixed} positions")

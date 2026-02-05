#!/usr/bin/env python3
"""
Fixed position scraper - gets position from player profile page
More reliable than roster table parsing
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import re

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

# Valid position keywords to validate
VALID_POSITIONS = [
    'Goalkeeper', 'Defender', 'Midfield', 'Attack', 'Forward', 
    'Centre-Back', 'Left-Back', 'Right-Back', 'Sweeper',
    'Central Midfield', 'Defensive Midfield', 'Attacking Midfield',
    'Left Midfield', 'Right Midfield',
    'Left Winger', 'Right Winger', 'Centre-Forward', 'Second Striker'
]

def is_valid_position(pos):
    """Check if position string is actually a valid position"""
    if not pos:
        return False
    return any(vp.lower() in pos.lower() for vp in VALID_POSITIONS)

def get_position_from_profile(profile_url):
    """Scrape position from player's profile page"""
    try:
        resp = requests.get(profile_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None
        
        soup = BeautifulSoup(resp.text, 'lxml')
        
        # Method 1: Look for position in player info section
        # The position is usually in a span with class containing "detail-position"
        pos_span = soup.select_one('.detail-position__position')
        if pos_span:
            pos = pos_span.get_text(strip=True)
            if is_valid_position(pos):
                return pos
        
        # Method 2: Look in data header
        for item in soup.select('.data-header__items li'):
            label = item.select_one('.data-header__label')
            if label and 'position' in label.get_text().lower():
                value = item.select_one('.data-header__content')
                if value:
                    pos = value.get_text(strip=True)
                    if is_valid_position(pos):
                        return pos
        
        # Method 3: Search in info table
        info_table = soup.select_one('.info-table')
        if info_table:
            for row in info_table.select('.info-table__content'):
                spans = row.select('span')
                for i, span in enumerate(spans):
                    if 'position' in span.get_text().lower() and i+1 < len(spans):
                        pos = spans[i+1].get_text(strip=True)
                        if is_valid_position(pos):
                            return pos
        
        return None
    except Exception as e:
        return None

# Test on a few players first
print("Testing scraper on 5 players...")
test_urls = [
    ("Târnovanu", "https://www.transfermarkt.com/stefan-tarnovanu/profil/spieler/568544"),
    ("Messi", "https://www.transfermarkt.com/lionel-messi/profil/spieler/28003"),
    ("Haaland", "https://www.transfermarkt.com/erling-haaland/profil/spieler/418560"),
]

for name, url in test_urls:
    pos = get_position_from_profile(url)
    status = "✓" if is_valid_position(pos) else "✗"
    print(f"  {status} {name}: {pos}")
    time.sleep(0.5)

print("\nScraper test complete!")

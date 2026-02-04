#!/usr/bin/env python3
"""
Scrape full player profiles for all players in the database.
Adds: appearances, goals, assists, yellow cards, red cards, minutes.
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
import os
from datetime import datetime

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

PROGRESS_FILE = 'profile_scrape_progress.json'
DATA_FILE = 'complete_progress.json'

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {'completed_ids': [], 'last_update': None}

def save_progress(progress):
    progress['last_update'] = datetime.now().isoformat()
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f)

def load_players():
    with open(DATA_FILE) as f:
        return json.load(f)

def save_players(data):
    data['last_update'] = datetime.now().isoformat()
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

def get_stats_url(profile_url):
    """Convert profile URL to stats URL"""
    # https://www.transfermarkt.com/stefan-tarnovanu/profil/spieler/568544
    # -> https://www.transfermarkt.com/stefan-tarnovanu/leistungsdaten/spieler/568544/saison//verein/0/liga/0/wettbewerb//pos/0/trainer_id/0/plus/1
    return profile_url.replace('/profil/', '/leistungsdaten/') + '/saison//verein/0/liga/0/wettbewerb//pos/0/trainer_id/0/plus/1'

def scrape_player_stats(profile_url):
    """Scrape stats from player's performance data page"""
    try:
        stats_url = get_stats_url(profile_url)
        resp = requests.get(stats_url, headers=HEADERS, timeout=30)
        soup = BeautifulSoup(resp.text, 'lxml')
        
        stats = {
            'appearances': 0,
            'goals': 0,
            'assists': 0,
            'yellow_cards': 0,
            'second_yellow': 0,
            'red_cards': 0,
            'minutes': 0,
        }
        
        # Find the totals row in footer
        footer_rows = soup.select('tfoot tr')
        for row in footer_rows:
            cells = row.select('td')
            if len(cells) >= 12:
                first_cell = cells[0].text.strip().lower()
                if 'total' in first_cell:
                    # Parse stats from cells
                    # Format: Total, -, Apps, -, -, -, -, Goals, -, Assists, Yellow, 2ndYellow, Minutes
                    try:
                        stats['appearances'] = int(cells[2].text.strip() or 0)
                    except:
                        pass
                    try:
                        stats['goals'] = int(cells[7].text.strip() or 0)
                    except:
                        pass
                    try:
                        stats['assists'] = int(cells[9].text.strip() or 0)
                    except:
                        pass
                    try:
                        stats['yellow_cards'] = int(cells[10].text.strip() or 0)
                    except:
                        pass
                    try:
                        stats['second_yellow'] = int(cells[11].text.strip() or 0)
                    except:
                        pass
                    try:
                        # Minutes format: "3.140'" - remove quotes and dots
                        mins_text = cells[12].text.strip().replace("'", "").replace(".", "")
                        stats['minutes'] = int(mins_text or 0)
                    except:
                        pass
                    break
        
        # Also get profile info if available
        resp2 = requests.get(profile_url, headers=HEADERS, timeout=30)
        soup2 = BeautifulSoup(resp2.text, 'lxml')
        
        # Height
        height_span = soup2.find('span', text=re.compile(r'Height:', re.I))
        if height_span:
            height_val = height_span.find_next_sibling('span')
            if height_val:
                stats['height'] = height_val.text.strip()
        
        # Foot
        foot_span = soup2.find('span', text=re.compile(r'Foot:', re.I))
        if foot_span:
            foot_val = foot_span.find_next_sibling('span')
            if foot_val:
                stats['foot'] = foot_val.text.strip()
        
        # Position (from header)
        pos_el = soup2.select_one('div.detail-position__position')
        if pos_el:
            stats['position'] = pos_el.text.strip()
        
        return stats
        
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    print("=" * 60)
    print("FULL PROFILE SCRAPER")
    print("=" * 60)
    
    data = load_players()
    players = data.get('players', [])
    progress = load_progress()
    completed_ids = set(progress.get('completed_ids', []))
    
    print(f"Total players: {len(players)}")
    print(f"Already completed: {len(completed_ids)}")
    print(f"Remaining: {len(players) - len(completed_ids)}")
    print("=" * 60)
    
    processed = 0
    errors = 0
    
    for i, player in enumerate(players):
        player_id = player.get('player_id')
        
        if not player_id or player_id in completed_ids:
            continue
        
        url = player.get('profile_url')
        if not url:
            continue
        
        name = player.get('name', 'Unknown')
        print(f"[{i+1}/{len(players)}] {name}...", end=' ', flush=True)
        
        stats = scrape_player_stats(url)
        
        if stats:
            player.update(stats)
            completed_ids.add(player_id)
            processed += 1
            print(f"✓ apps:{stats.get('appearances', 0)} goals:{stats.get('goals', 0)} assists:{stats.get('assists', 0)}")
        else:
            errors += 1
            print("✗")
        
        # Save every 50 players
        if processed % 50 == 0 and processed > 0:
            progress['completed_ids'] = list(completed_ids)
            save_progress(progress)
            save_players(data)
            print(f"   [Saved: {len(completed_ids)} done]")
        
        # Rate limit: 2 requests per player, so 3 sec delay
        time.sleep(3)
    
    # Final save
    progress['completed_ids'] = list(completed_ids)
    save_progress(progress)
    save_players(data)
    
    print("=" * 60)
    print(f"COMPLETE! Processed: {processed}, Errors: {errors}")
    print("=" * 60)

if __name__ == "__main__":
    main()

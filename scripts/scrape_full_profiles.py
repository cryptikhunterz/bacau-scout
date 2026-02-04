#!/usr/bin/env python3
"""
Scrape full player profiles (not performance stats).
Gets: photo, DOB, nationality, height, foot, position, market value, contract, career totals.
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

PROGRESS_FILE = 'full_profile_progress.json'
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

def scrape_profile(url):
    """Scrape full profile from player page"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        soup = BeautifulSoup(resp.text, 'lxml')
        
        profile = {}
        
        # Photo URL
        photo_el = soup.select_one('img.data-header__profile-image')
        if photo_el:
            profile['photo_url'] = photo_el.get('src', '')
        
        # Player header info
        header = soup.select_one('div.data-header__profile-container')
        if header:
            # Shirt number
            shirt = header.select_one('span.data-header__shirt-number')
            if shirt:
                profile['shirt_number'] = shirt.text.strip().replace('#', '')
        
        # Info table (DOB, height, nationality, etc.)
        info_table = soup.select_one('div.info-table')
        if info_table:
            rows = info_table.select('span.info-table__content')
            labels = info_table.select('span.info-table__content--regular')
            
            for i, label_el in enumerate(labels):
                label = label_el.text.strip().lower()
                # Get the next sibling or corresponding content
                value_el = label_el.find_next_sibling('span', class_='info-table__content--bold') or \
                           label_el.find_next_sibling('span')
                if not value_el:
                    continue
                value = value_el.text.strip()
                
                if 'date of birth' in label:
                    profile['date_of_birth'] = value
                    age_match = re.search(r'\((\d+)\)', value)
                    if age_match:
                        profile['age'] = int(age_match.group(1))
                elif 'place of birth' in label:
                    profile['place_of_birth'] = value
                elif 'height' in label:
                    profile['height'] = value
                elif 'citizenship' in label:
                    profile['citizenship'] = value
                elif 'position' in label:
                    profile['position'] = value
                elif 'foot' in label:
                    profile['foot'] = value
                elif 'agent' in label:
                    profile['agent'] = value
                elif 'current club' in label:
                    profile['current_club'] = value
                elif 'joined' in label:
                    profile['joined'] = value
                elif 'contract expires' in label:
                    profile['contract_expires'] = value
        
        # Market value from header
        mv_el = soup.select_one('a.data-header__market-value-wrapper')
        if mv_el:
            profile['market_value'] = mv_el.text.strip()
        
        # Position from detail box
        pos_el = soup.select_one('div.detail-position__position')
        if pos_el and 'position' not in profile:
            profile['position'] = pos_el.text.strip()
        
        # Get career totals from the stats box on profile page
        stats_boxes = soup.select('div.data-header__content--highlight')
        for box in stats_boxes:
            text = box.text.strip()
            label_el = box.find_next_sibling('span') or box.find_previous_sibling('span')
            if label_el:
                label = label_el.text.strip().lower()
                try:
                    num = int(re.sub(r'[^\d]', '', text) or 0)
                    if 'appearance' in label or 'match' in label:
                        profile['total_appearances'] = num
                    elif 'goal' in label and 'assist' not in label:
                        profile['total_goals'] = num
                    elif 'assist' in label:
                        profile['total_assists'] = num
                except:
                    pass
        
        # Alternative: scrape from the compact stats if available
        compact_stats = soup.select('li.data-header__label')
        for stat in compact_stats:
            spans = stat.select('span')
            if len(spans) >= 2:
                value_text = spans[0].text.strip()
                label_text = spans[1].text.strip().lower() if len(spans) > 1 else ''
                try:
                    num = int(re.sub(r'[^\d]', '', value_text) or 0)
                    if 'appearance' in label_text:
                        profile['total_appearances'] = num
                    elif 'goal' in label_text and 'assist' not in label_text:
                        profile['total_goals'] = num
                    elif 'assist' in label_text:
                        profile['total_assists'] = num
                except:
                    pass
        
        # National team info
        nt_section = soup.select_one('div[data-viewport="Nationalspieler"]')
        if nt_section:
            nt_row = nt_section.select_one('tr')
            if nt_row:
                cells = nt_row.select('td')
                if len(cells) >= 3:
                    profile['national_team'] = cells[1].text.strip() if len(cells) > 1 else ''
                    profile['national_team_caps'] = cells[2].text.strip() if len(cells) > 2 else ''
        
        return profile
        
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
        
        profile = scrape_profile(url)
        
        if profile:
            player.update(profile)
            completed_ids.add(player_id)
            processed += 1
            apps = profile.get('total_appearances', '?')
            goals = profile.get('total_goals', '?')
            pos = profile.get('position', '?')
            print(f"✓ {pos} | apps:{apps} goals:{goals}")
        else:
            errors += 1
            print("✗")
        
        # Save every 50 players
        if processed % 50 == 0 and processed > 0:
            progress['completed_ids'] = list(completed_ids)
            save_progress(progress)
            save_players(data)
            print(f"   [Saved: {len(completed_ids)} done]")
        
        # Rate limit
        time.sleep(2)
    
    # Final save
    progress['completed_ids'] = list(completed_ids)
    save_progress(progress)
    save_players(data)
    
    print("=" * 60)
    print(f"COMPLETE! Processed: {processed}, Errors: {errors}")
    print("=" * 60)

if __name__ == "__main__":
    main()

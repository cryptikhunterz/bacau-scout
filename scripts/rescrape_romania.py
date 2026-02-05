#!/usr/bin/env python3
"""
Fast Romanian leagues rescrape - current season 2025/26
Gets roster data for RO1, RO2, RO3 with saison_id=2025
Updates existing players.json with fresh club/team data
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os
import re
from datetime import datetime

def get_current_season():
    """Calculate Transfermarkt season year dynamically.
    TM uses start year: Aug 2025 onward = 2025, before Aug 2025 = 2024."""
    from datetime import datetime
    now = datetime.now()
    return now.year if now.month >= 8 else now.year - 1


HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
}

RO_LEAGUES = [
    ("Romania Liga 1", "RO1"),
    ("Romania Liga 2", "RO2"),
    ("Romania Liga 3", "RO3"),
]

def fetch_page(url, retries=3):
    for i in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            if resp.status_code == 200:
                return resp.text
            elif resp.status_code == 429:
                print(f"  Rate limited, waiting 60s...")
                time.sleep(60)
            else:
                print(f"  HTTP {resp.status_code} for {url}")
        except Exception as e:
            print(f"  Error: {e}")
            time.sleep(5)
    return None

def get_teams(league_code):
    url = f"https://www.transfermarkt.com/wettbewerb/startseite/wettbewerb/{league_code}"
    html = fetch_page(url)
    if not html:
        return []
    
    soup = BeautifulSoup(html, 'lxml')
    teams = []
    seen = set()
    
    links = soup.find_all('a', href=lambda x: x and '/startseite/verein/' in x)
    for link in links:
        href = link.get('href', '')
        match = re.search(r'/verein/(\d+)', href)
        if match:
            team_id = match.group(1)
            if team_id not in seen:
                seen.add(team_id)
                name = link.get('title') or link.get_text(strip=True)
                if name and len(name) > 1:
                    teams.append({'id': team_id, 'name': name})
    
    return teams

def get_roster(team_id, team_name):
    """Get detailed roster from team page - current season 2025/26"""
    url = f"https://www.transfermarkt.com/team/kader/verein/{team_id}/saison_id/{get_current_season()}/plus/1"
    html = fetch_page(url)
    if not html:
        return []
    
    soup = BeautifulSoup(html, 'lxml')
    players = []
    
    table = soup.find('table', class_='items')
    if not table:
        return []
    
    rows = table.find_all('tr', class_=['odd', 'even'])
    for row in rows:
        try:
            link = row.find('a', href=lambda x: x and '/profil/spieler/' in x)
            if not link:
                continue
            
            href = link.get('href', '')
            match = re.search(r'/spieler/(\d+)', href)
            if not match:
                continue
            
            player = {
                'player_id': match.group(1),
                'name': link.get_text(strip=True),
                'profile_url': f"https://www.transfermarkt.com{href}",
            }
            
            # Position from inline table
            inline = row.find('table', class_='inline-table')
            if inline:
                trs = inline.find_all('tr')
                if len(trs) > 1:
                    player['position'] = trs[1].get_text(strip=True)
            
            # Photo URL
            img = row.find('img', class_='bilderrahmen-fixed')
            if img:
                player['photo_url'] = img.get('data-src') or img.get('src')
            
            # Age from cells
            cells = row.find_all('td')
            for cell in cells:
                text = cell.get_text(strip=True)
                # DOB cell format: "Feb 5, 2000 (25)"
                if '(' in text and ')' in text:
                    age_match = re.search(r'\((\d+)\)', text)
                    if age_match:
                        age = int(age_match.group(1))
                        if 14 <= age <= 50:
                            player['age'] = age
                            player['date_of_birth'] = text
            
            # Market value
            mv_cell = row.find('td', class_='rechts hauptlink')
            if mv_cell:
                player['market_value'] = mv_cell.get_text(strip=True)
            
            # Nationality - only from info table flags, not header
            flag_cells = row.find_all('td', class_='zentriert')
            for fc in flag_cells:
                flags = fc.find_all('img', class_='flaggenrahmen')
                if flags:
                    nats = list(set(f.get('title') for f in flags if f.get('title')))
                    if nats:
                        player['nationality'] = nats[0] if len(nats) == 1 else nats
                    break
            
            # Shirt number
            shirt = row.find('div', class_='rn_nummer')
            if shirt:
                player['shirt_number'] = shirt.get_text(strip=True)
            
            # Height
            for cell in cells:
                text = cell.get_text(strip=True)
                if 'm' in text and ',' in text and len(text) < 10:
                    player['height'] = text
            
            # Foot preference
            for cell in cells:
                text = cell.get_text(strip=True).lower()
                if text in ('left', 'right', 'both'):
                    player['foot'] = text
            
            players.append(player)
        except Exception as e:
            continue
    
    return players

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    players_file = os.path.join(script_dir, '..', 'public', 'players.json')
    
    # Load existing players
    print(f"Loading existing data...")
    with open(players_file, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    
    print(f"Existing: {len(existing)} players")
    
    # Build lookup by player_id
    existing_map = {}
    for p in existing:
        pid = p.get('player_id')
        if pid:
            existing_map[pid] = p
    
    # Remove all Romanian players (will be replaced with fresh data)
    non_ro = [p for p in existing if p.get('league_code', '') not in ('RO1', 'RO2', 'RO3')]
    print(f"Non-Romanian players kept: {len(non_ro)}")
    
    # Scrape fresh Romanian data
    all_ro_players = []
    
    for league_name, league_code in RO_LEAGUES:
        print(f"\n{'='*50}")
        print(f"[{league_code}] {league_name}")
        print(f"{'='*50}")
        
        teams = get_teams(league_code)
        print(f"  Teams: {len(teams)}")
        time.sleep(random.uniform(1.5, 3))
        
        for ti, team in enumerate(teams):
            print(f"  [{ti+1}/{len(teams)}] {team['name']}...", end=' ', flush=True)
            
            roster = get_roster(team['id'], team['name'])
            print(f"{len(roster)} players")
            
            for player in roster:
                pid = player['player_id']
                
                # Merge with existing enriched data if available
                old = existing_map.get(pid, {})
                
                full_player = {
                    'player_id': pid,
                    'name': player.get('name', old.get('name', '')),
                    'profile_url': player.get('profile_url', old.get('profile_url', '')),
                    'position': player.get('position') or old.get('position'),
                    'market_value': player.get('market_value', old.get('market_value', '-')),
                    'nationality': player.get('nationality', old.get('nationality', '')),
                    'shirt_number': player.get('shirt_number', old.get('shirt_number', '')),
                    'date_of_birth': player.get('date_of_birth', old.get('date_of_birth', '')),
                    'height': player.get('height', old.get('height', '')),
                    'foot': player.get('foot', old.get('foot', '')),
                    'photo_url': player.get('photo_url', old.get('photo_url', '')),
                    'age': player.get('age') or old.get('age'),
                    # Fresh club data from current season!
                    'club': team['name'],
                    'club_id': team['id'],
                    'league': league_name,
                    'league_code': league_code,
                    'scraped_at': datetime.now().isoformat(),
                    # Keep old career stats if they exist
                    'career_stats': old.get('career_stats', {}),
                    'appearances': old.get('appearances') or (old.get('career_stats', {}).get('total_appearances', 0)),
                    'goals': old.get('goals') or (old.get('career_stats', {}).get('total_goals', 0)),
                    'assists': old.get('assists') or (old.get('career_stats', {}).get('total_assists', 0)),
                }
                
                all_ro_players.append(full_player)
            
            time.sleep(random.uniform(1.5, 2.5))
    
    # Combine and save
    final = non_ro + all_ro_players
    
    print(f"\n{'='*50}")
    print(f"Romanian players scraped: {len(all_ro_players)}")
    print(f"Total database: {len(final)}")
    print(f"{'='*50}")
    
    # Backup old file
    backup = players_file + '.bak'
    import shutil
    shutil.copy2(players_file, backup)
    print(f"Backed up old data to {backup}")
    
    # Save
    with open(players_file, 'w', encoding='utf-8') as f:
        json.dump(final, f, ensure_ascii=False)
    
    print(f"✅ Saved to {players_file}")
    print(f"Done at {datetime.now()}")

if __name__ == "__main__":
    main()

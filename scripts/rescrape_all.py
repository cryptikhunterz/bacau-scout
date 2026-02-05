#!/usr/bin/env python3
"""
Fast rescrape ALL leagues - current season rosters only.
Updates club/roster data while keeping existing enriched profile data + stats.
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os
import re
import shutil
from datetime import datetime

def get_current_season():
    now = datetime.now()
    return now.year if now.month >= 8 else now.year - 1

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
}

LEAGUES = [
    ("Romania Liga 1", "RO1"),
    ("Romania Liga 2", "RO2"),
    ("Croatia 1. HNL", "KR1"),
    ("Croatia 2. HNL", "KR2"),
    ("Serbia SuperLiga", "SER1"),
    ("Serbia Prva Liga", "SER2"),
    ("Albania Superiore", "ALB1"),
    ("Kosovo Superliga", "KO1"),
    ("Montenegro 1. CFL", "MNE1"),
    ("Slovenia 1. SNL", "SL1"),
    ("Slovenia 2. SNL", "SL2"),
    ("Bosnia Premier Liga", "BOS1"),
    ("Italy Serie C Group A", "IT3A"),
    ("Italy Serie C Group B", "IT3B"),
    ("Italy Serie C Group C", "IT3C"),
    ("Portugal Liga 2", "PO2"),
    ("Portugal Liga 3", "PT3A"),
    ("France National 1", "FR3"),
    ("France National 2 Group A", "CN2A"),
    ("France National 2 Group B", "CN2B"),
    ("France National 2 Group C", "CN2C"),
    ("France National 2 Group D", "CN2D"),
    ("Spain Primera RFEF Group 1", "ES3A"),
    ("Spain Primera RFEF Group 2", "ES3B"),
    ("Belgium Challenger Pro", "BE2"),
    ("Poland Ekstraklasa", "PL1"),
    ("Poland 1. Liga", "PL2"),
    ("Austria Bundesliga", "A1"),
    ("Austria 2. Liga", "A2"),
    ("Czech 1. Liga", "TS1"),
    ("Czech 2. Liga", "TS2"),
    ("Slovakia Nike Liga", "SLO1"),
    ("Netherlands Eerste Divisie", "NL2"),
    ("Finland Veikkausliiga", "FI1"),
    ("Lithuania A Lyga", "LI1"),
    ("Estonia Meistriliiga", "EST1"),
    ("MLS Next Pro", "MNP3"),
]

def fetch_page(url, retries=3):
    for i in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            if resp.status_code == 200:
                return resp.text
            elif resp.status_code == 429:
                print(f"  ⚠ Rate limited, waiting 60s...")
                time.sleep(60)
            elif resp.status_code == 302:
                return None  # Redirect = league doesn't exist
            else:
                print(f"  HTTP {resp.status_code}")
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

def get_roster(team_id):
    season = get_current_season()
    url = f"https://www.transfermarkt.com/team/kader/verein/{team_id}/saison_id/{season}/plus/1"
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
            
            # Position
            inline = row.find('table', class_='inline-table')
            if inline:
                trs = inline.find_all('tr')
                if len(trs) > 1:
                    player['position'] = trs[1].get_text(strip=True)
            
            # Photo
            img = row.find('img', class_='bilderrahmen-fixed')
            if img:
                player['photo_url'] = img.get('data-src') or img.get('src')
            
            # Age + DOB
            cells = row.find_all('td')
            for cell in cells:
                text = cell.get_text(strip=True)
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
            
            # Nationality
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
            
            # Height + Foot
            for cell in cells:
                text = cell.get_text(strip=True)
                if 'm' in text and ',' in text and len(text) < 10:
                    player['height'] = text
                if text.lower() in ('left', 'right', 'both'):
                    player['foot'] = text.lower()
            
            players.append(player)
        except:
            continue
    
    return players

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    players_file = os.path.join(script_dir, '..', 'public', 'players.json')
    progress_file = os.path.join(script_dir, 'rescrape_progress.json')
    
    # Load existing
    print(f"Loading existing data...")
    with open(players_file, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    
    # Build lookup
    existing_map = {}
    for p in existing:
        pid = p.get('player_id')
        if pid:
            existing_map[pid] = p
    
    # Load progress if resuming
    completed_leagues = []
    all_new_players = []
    if os.path.exists(progress_file):
        with open(progress_file, 'r') as f:
            progress = json.load(f)
            completed_leagues = progress.get('completed_leagues', [])
            all_new_players = progress.get('players', [])
            print(f"Resuming: {len(completed_leagues)} leagues done, {len(all_new_players)} players")
    
    print(f"Existing: {len(existing)} players")
    print(f"Season: {get_current_season()}")
    print(f"Started: {datetime.now()}")
    print()
    
    total_teams = 0
    
    for league_name, league_code in LEAGUES:
        if league_code in completed_leagues:
            print(f"[SKIP] {league_name}")
            continue
        
        print(f"[{league_code}] {league_name}...", end=' ', flush=True)
        
        teams = get_teams(league_code)
        if not teams:
            print(f"0 teams (skipped)")
            completed_leagues.append(league_code)
            continue
        
        print(f"{len(teams)} teams")
        total_teams += len(teams)
        time.sleep(random.uniform(1, 2))
        
        league_players = 0
        for ti, team in enumerate(teams):
            roster = get_roster(team['id'])
            
            for player in roster:
                pid = player['player_id']
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
                    'citizenship': old.get('citizenship', ''),
                    'contract_expires': old.get('contract_expires', ''),
                    'photo_url': player.get('photo_url', old.get('photo_url', '')),
                    'age': player.get('age') or old.get('age'),
                    'club': team['name'],
                    'club_id': team['id'],
                    'league': league_name,
                    'league_code': league_code,
                    'scraped_at': datetime.now().isoformat(),
                    'career_stats': old.get('career_stats', {}),
                    'appearances': old.get('appearances') or (old.get('career_stats', {}).get('total_appearances', 0)),
                    'goals': old.get('goals') or (old.get('career_stats', {}).get('total_goals', 0)),
                    'assists': old.get('assists') or (old.get('career_stats', {}).get('total_assists', 0)),
                }
                
                all_new_players.append(full_player)
                league_players += 1
            
            time.sleep(random.uniform(1.2, 2))
        
        completed_leagues.append(league_code)
        print(f"  → {league_players} players")
        
        # Save progress after each league
        with open(progress_file, 'w') as f:
            json.dump({
                'completed_leagues': completed_leagues,
                'players': all_new_players,
                'last_update': datetime.now().isoformat()
            }, f, ensure_ascii=False)
        
        time.sleep(random.uniform(1, 2))
    
    # Save final
    print(f"\n{'='*50}")
    print(f"Scraped: {len(all_new_players)} players from {total_teams} teams")
    
    # Backup
    shutil.copy2(players_file, players_file + '.bak')
    
    with open(players_file, 'w', encoding='utf-8') as f:
        json.dump(all_new_players, f, ensure_ascii=False)
    
    # Cleanup progress file
    if os.path.exists(progress_file):
        os.remove(progress_file)
    
    print(f"Total: {len(all_new_players)} players saved")
    print(f"Done: {datetime.now()}")

if __name__ == "__main__":
    main()

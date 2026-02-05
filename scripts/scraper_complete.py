#!/usr/bin/env python3
"""
Transfermarkt COMPLETE Scraper for Bacau Scout
Gets ALL players with FULL details in one pass.
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
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
}

LEAGUES = [
    ("Romania Liga 1", "RO1"),
    ("Romania Liga 2", "RO2"),
    ("Romania Liga 3", "RO3"),
    ("Croatia 1. HNL", "KR1"),
    ("Croatia 2. HNL", "KR2"),
    ("Serbia SuperLiga", "SER1"),
    ("Serbia Prva Liga", "SER2"),
    ("Albania Superiore", "ALB1"),
    ("Kosovo Superliga", "KOS1"),
    ("Montenegro 1. CFL", "MNE1"),
    ("Slovenia 1. SNL", "SL1"),
    ("Slovenia 2. SNL", "SL2"),
    ("Bosnia Premier Liga", "BOS1"),
    ("Italy Serie C Group A", "IT3A"),
    ("Italy Serie C Group B", "IT3B"),
    ("Italy Serie C Group C", "IT3C"),
    ("Portugal Liga 2", "PO2"),
    ("Portugal Liga 3", "PO3"),
    ("France National 1", "FR3"),
    ("France National 2", "FR4"),
    ("Spain Primera RFEF", "ES3"),
    ("Spain Segunda RFEF", "ES4"),
    ("Belgium Challenger Pro", "BE2"),
    ("Poland Ekstraklasa", "PL1"),
    ("Poland 1. Liga", "PL2"),
    ("Austria Bundesliga", "A1"),
    ("Austria 2. Liga", "A2"),
    ("Czech 1. Liga", "TS1"),
    ("Czech 2. Liga", "TS2"),
    ("Slovakia Super Liga", "SK1"),
    ("Netherlands Eerste Divisie", "NL2"),
    ("Finland Veikkausliiga", "FI1"),
    ("Lithuania A Lyga", "LI1"),
    ("Estonia Meistriliiga", "EST1"),
    ("MLS Next Pro", "MNP3"),
]

def fetch_page(url, retries=3):
    """Fetch a page with retries"""
    for i in range(retries):
        try:
            response = requests.get(url, headers=HEADERS, timeout=30)
            if response.status_code == 200:
                return response.text
            elif response.status_code == 429:
                print(f"      Rate limited, waiting 60s...")
                time.sleep(60)
            else:
                print(f"      HTTP {response.status_code}")
        except Exception as e:
            print(f"      Error: {e}")
            time.sleep(5)
    return None

def get_teams(league_code):
    """Get teams in a league"""
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
    """Get players from team roster"""
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
            # Find player link
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
                'profile_url': f"https://www.transfermarkt.com{href}"
            }
            
            # Position
            inline = row.find('table', class_='inline-table')
            if inline:
                trs = inline.find_all('tr')
                if len(trs) > 1:
                    player['position'] = trs[1].get_text(strip=True)
            
            # Age and DOB
            cells = row.find_all('td')
            for cell in cells:
                text = cell.get_text(strip=True)
                if text.isdigit() and 14 <= int(text) <= 50:
                    player['age'] = int(text)
                if '(' in text and ')' in text and any(m in text for m in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']):
                    player['dob'] = text
            
            # Market value
            mv_cell = row.find('td', class_='rechts hauptlink')
            if mv_cell:
                player['market_value'] = mv_cell.get_text(strip=True)
            
            # Nationality
            flags = row.find_all('img', class_='flaggenrahmen')
            nats = [f.get('title') for f in flags if f.get('title')]
            if nats:
                player['nationality'] = nats[0] if len(nats) == 1 else nats
            
            # Shirt number
            shirt = row.find('div', class_='rn_nummer')
            if shirt:
                player['shirt_number'] = shirt.get_text(strip=True)
            
            players.append(player)
        except:
            continue
    
    return players

def get_player_details(player_id):
    """Get full player details from profile"""
    url = f"https://www.transfermarkt.com/spieler/profil/spieler/{player_id}"
    html = fetch_page(url)
    if not html:
        return {}
    
    soup = BeautifulSoup(html, 'lxml')
    details = {}
    
    # Parse info table
    info_items = soup.find_all('span', class_='info-table__content')
    labels = soup.find_all('span', class_='info-table__content--regular')
    
    label_map = {
        'height': ['height'],
        'citizenship': ['citizenship'],
        'position': ['position'],
        'foot': ['foot'],
        'agent': ['player agent', 'agent'],
        'joined': ['joined'],
        'contract_expires': ['contract expires'],
        'date_of_birth': ['date of birth', 'birth'],
        'place_of_birth': ['place of birth'],
        'outfitter': ['outfitter'],
    }
    
    for i, label_elem in enumerate(labels):
        label_text = label_elem.get_text(strip=True).lower()
        if i < len(info_items):
            value = info_items[i].get_text(strip=True)
            for key, patterns in label_map.items():
                if any(p in label_text for p in patterns):
                    details[key] = value
                    break
    
    # Full name from header
    header = soup.find('h1', class_='data-header__headline-wrapper')
    if header:
        details['full_name'] = header.get_text(strip=True)
    
    # Current club
    club_elem = soup.find('span', class_='data-header__club')
    if club_elem:
        link = club_elem.find('a')
        if link:
            details['current_club'] = link.get_text(strip=True)
    
    # Career stats - get from leistungsdaten page
    stats_url = f"https://www.transfermarkt.com/spieler/leistungsdaten/spieler/{player_id}/plus/0?saession_id=ges"
    stats_html = fetch_page(stats_url)
    if stats_html:
        stats_soup = BeautifulSoup(stats_html, 'lxml')
        
        # Look for total stats row or career totals
        career_stats = {
            'total_appearances': 0,
            'total_goals': 0,
            'total_assists': 0,
            'stats_by_season': []
        }
        
        # Find stats table
        stats_table = stats_soup.find('table', class_='items')
        if stats_table:
            rows = stats_table.find_all('tr', class_=['odd', 'even'])
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 5:
                    try:
                        season_stat = {}
                        # Season
                        season_cell = cells[0].get_text(strip=True)
                        if season_cell:
                            season_stat['season'] = season_cell
                        
                        # Competition
                        comp_link = row.find('a', href=lambda x: x and '/wettbewerb/' in x)
                        if comp_link:
                            season_stat['competition'] = comp_link.get_text(strip=True)
                        
                        # Stats are usually in last few cells
                        for cell in cells:
                            text = cell.get_text(strip=True)
                            # Look for appearances (usually a number)
                            if cell.get('class') and 'zentriert' in ' '.join(cell.get('class', [])):
                                if text.isdigit():
                                    if 'appearances' not in season_stat:
                                        season_stat['appearances'] = int(text)
                        
                        # Goals cell usually has specific class
                        goals_cell = row.find('td', class_='kicker')
                        if not goals_cell:
                            # Try finding by position
                            for i, cell in enumerate(cells):
                                text = cell.get_text(strip=True)
                                if text.isdigit() or text == '-':
                                    val = int(text) if text.isdigit() else 0
                                    if 'goals' not in season_stat:
                                        season_stat['goals'] = val
                                    elif 'assists' not in season_stat:
                                        season_stat['assists'] = val
                        
                        if season_stat.get('season'):
                            career_stats['stats_by_season'].append(season_stat)
                    except:
                        continue
        
        # Get totals from footer or sum
        totals_row = stats_soup.find('tfoot')
        if totals_row:
            cells = totals_row.find_all('td')
            for i, cell in enumerate(cells):
                text = cell.get_text(strip=True)
                if text.isdigit():
                    val = int(text)
                    if val > 0:
                        if career_stats['total_appearances'] == 0:
                            career_stats['total_appearances'] = val
                        elif career_stats['total_goals'] == 0:
                            career_stats['total_goals'] = val
                        elif career_stats['total_assists'] == 0:
                            career_stats['total_assists'] = val
        
        details['career_stats'] = career_stats
    
    return details

def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    progress_file = os.path.join(output_dir, 'complete_progress.json')
    output_file = os.path.join(output_dir, 'complete_database.json')
    
    all_players = []
    completed_players = set()
    completed_teams = set()
    completed_leagues = []
    
    # Load progress
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            progress = json.load(f)
            all_players = progress.get('players', [])
            completed_players = set(progress.get('completed_players', []))
            completed_teams = set(progress.get('completed_teams', []))
            completed_leagues = progress.get('completed_leagues', [])
            print(f"Resuming: {len(all_players)} players done")
    
    print(f"\n{'='*60}")
    print(f"COMPLETE SCRAPER - Full Details for All Players")
    print(f"Started: {datetime.now()}")
    print(f"{'='*60}")
    
    for league_name, league_code in LEAGUES:
        if league_code in completed_leagues:
            print(f"\n[SKIP] {league_name}")
            continue
        
        print(f"\n[LEAGUE] {league_name} ({league_code})")
        
        teams = get_teams(league_code)
        print(f"  Teams: {len(teams)}")
        
        if not teams:
            completed_leagues.append(league_code)
            continue
        
        time.sleep(random.uniform(2, 4))
        
        for ti, team in enumerate(teams):
            team_key = f"{league_code}_{team['id']}"
            if team_key in completed_teams:
                continue
            
            print(f"  [{ti+1}/{len(teams)}] {team['name']}")
            
            roster = get_roster(team['id'])
            print(f"    Players: {len(roster)}")
            
            time.sleep(random.uniform(2, 3))
            
            for pi, player in enumerate(roster):
                player_id = player['player_id']
                
                if player_id in completed_players:
                    continue
                
                # Get full details
                details = get_player_details(player_id)
                
                # Merge all data
                full_player = {
                    **player,
                    **details,
                    'club': team['name'],
                    'club_id': team['id'],
                    'league': league_name,
                    'league_code': league_code,
                    'scraped_at': datetime.now().isoformat()
                }
                
                all_players.append(full_player)
                completed_players.add(player_id)
                
                if (pi + 1) % 5 == 0:
                    print(f"      {pi+1}/{len(roster)} players...")
                
                # Rate limit per player (2 requests: profile + stats)
                time.sleep(random.uniform(2, 3.5))
            
            completed_teams.add(team_key)
            
            # Save progress after each team
            progress = {
                'players': all_players,
                'completed_players': list(completed_players),
                'completed_teams': list(completed_teams),
                'completed_leagues': completed_leagues,
                'last_update': datetime.now().isoformat()
            }
            with open(progress_file, 'w', encoding='utf-8') as f:
                json.dump(progress, f, ensure_ascii=False)
            
            print(f"    ✓ Saved ({len(all_players)} total)")
            
            time.sleep(random.uniform(3, 5))
        
        completed_leagues.append(league_code)
        print(f"  League complete! Total: {len(all_players)}")
        
        time.sleep(random.uniform(5, 10))
    
    # Final save
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_players, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"COMPLETE! {len(all_players)} players with full details")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()

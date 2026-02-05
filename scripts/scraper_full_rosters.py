#!/usr/bin/env python3
"""
Transfermarkt Full Roster Scraper for Bacau Scout
Gets ALL players from every team in each league.
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os
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

# Leagues with their Transfermarkt URLs
LEAGUES = [
    # Romania
    ("Romania Liga 1", "RO1", "superliga"),
    ("Romania Liga 2", "RO2", "liga-2"),
    ("Romania Liga 3", "RO3", "liga-iii"),
    
    # Balkans
    ("Croatia 1. HNL", "KR1", "1-hnl"),
    ("Croatia 2. HNL", "KR2", "2-hnl"),
    ("Serbia SuperLiga", "SER1", "super-liga-srbije"),
    ("Serbia Prva Liga", "SER2", "prva-liga-srbije"),
    ("Albania Superiore", "ALB1", "kategoria-superiore"),
    ("Kosovo Superliga", "KOS1", "superliga-e-kosoves"),
    ("Montenegro 1. CFL", "MNE1", "1-cfl"),
    ("Slovenia 1. SNL", "SL1", "prva-liga"),
    ("Slovenia 2. SNL", "SL2", "2-snl"),
    ("Bosnia Premier Liga", "BOS1", "premijer-liga-bih"),
    
    # Italy Lower
    ("Italy Serie C Group A", "IT3A", "serie-c-girone-a"),
    ("Italy Serie C Group B", "IT3B", "serie-c-girone-b"),
    ("Italy Serie C Group C", "IT3C", "serie-c-girone-c"),
    
    # Portugal
    ("Portugal Liga 2", "PO2", "liga-portugal-2"),
    ("Portugal Liga 3", "PO3", "liga-3"),
    
    # France
    ("France National 1", "FR3", "championnat-national"),
    ("France National 2", "FR4", "national-2"),
    
    # Spain
    ("Spain Primera RFEF", "ES3", "primera-division-rfef"),
    ("Spain Segunda RFEF", "ES4", "segunda-division-rfef"),
    
    # Belgium
    ("Belgium Challenger Pro", "BE2", "challenger-pro-league"),
    
    # Central/Eastern Europe
    ("Poland Ekstraklasa", "PL1", "pko-bp-ekstraklasa"),
    ("Poland 1. Liga", "PL2", "fortcuna-1-liga"),
    ("Austria Bundesliga", "A1", "bundesliga"),
    ("Austria 2. Liga", "A2", "2-liga"),
    ("Czech 1. Liga", "TS1", "fortuna-liga"),
    ("Czech 2. Liga", "TS2", "fnl"),
    ("Slovakia Super Liga", "SK1", "nike-liga"),
    
    # Netherlands
    ("Netherlands Eerste Divisie", "NL2", "keuken-kampioen-divisie"),
    
    # Nordics/Baltics
    ("Finland Veikkausliiga", "FI1", "veikkausliiga"),
    ("Lithuania A Lyga", "LI1", "a-lyga"),
    ("Estonia Meistriliiga", "EST1", "meistriliiga"),
    
    # USA
    ("MLS Next Pro", "MNP3", "mls-next-pro"),
]

def get_teams_in_league(league_code):
    """Get all teams in a league"""
    url = f"https://www.transfermarkt.com/wettbewerb/startseite/wettbewerb/{league_code}"
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        if response.status_code != 200:
            print(f"    Error fetching league: HTTP {response.status_code}")
            return []
        
        soup = BeautifulSoup(response.text, 'lxml')
        teams = []
        
        # Find team links in the table
        table = soup.find('table', class_='items')
        if not table:
            # Try alternative layout
            team_links = soup.find_all('a', href=lambda x: x and '/startseite/verein/' in x)
            seen = set()
            for link in team_links:
                href = link.get('href', '')
                team_id = href.split('/verein/')[-1].split('/')[0] if '/verein/' in href else None
                if team_id and team_id not in seen and team_id.isdigit():
                    seen.add(team_id)
                    name = link.get('title') or link.get_text(strip=True)
                    if name and len(name) > 1:
                        teams.append({
                            'id': team_id,
                            'name': name,
                            'url': f"https://www.transfermarkt.com/team/kader/verein/{team_id}/saison_id/{get_current_season()}/plus/1"
                        })
            return teams
        
        rows = table.find_all('tr', class_=['odd', 'even'])
        for row in rows:
            link = row.find('a', href=lambda x: x and '/startseite/verein/' in x)
            if link:
                href = link.get('href', '')
                team_id = href.split('/verein/')[-1].split('/')[0] if '/verein/' in href else None
                if team_id and team_id.isdigit():
                    name = link.get('title') or link.get_text(strip=True)
                    teams.append({
                        'id': team_id,
                        'name': name,
                        'url': f"https://www.transfermarkt.com/team/kader/verein/{team_id}/saison_id/{get_current_season()}/plus/1"
                    })
        
        return teams
        
    except Exception as e:
        print(f"    Error: {e}")
        return []

def get_team_roster(team):
    """Get all players from a team's roster"""
    url = team['url']
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        if response.status_code != 200:
            return []
        
        soup = BeautifulSoup(response.text, 'lxml')
        players = []
        
        # Find player table
        table = soup.find('table', class_='items')
        if not table:
            return []
        
        rows = table.find_all('tr', class_=['odd', 'even'])
        
        for row in rows:
            try:
                player = {'club': team['name'], 'club_id': team['id']}
                
                # Player name and link
                name_cell = row.find('td', class_='hauptlink')
                if name_cell:
                    link = name_cell.find('a')
                    if link:
                        player['name'] = link.get_text(strip=True)
                        href = link.get('href', '')
                        if '/profil/spieler/' in href:
                            player['player_id'] = href.split('/spieler/')[-1].split('/')[0]
                            player['profile_url'] = f"https://www.transfermarkt.com{href}"
                
                # Position from inline table
                inline = row.find('table', class_='inline-table')
                if inline:
                    pos_row = inline.find_all('tr')
                    if len(pos_row) > 1:
                        player['position'] = pos_row[1].get_text(strip=True)
                
                # Find all td cells for other data
                cells = row.find_all('td')
                for cell in cells:
                    text = cell.get_text(strip=True)
                    
                    # Age (number between 14-50)
                    if text.isdigit() and 14 <= int(text) <= 50 and 'age' not in player:
                        player['age'] = text
                    
                    # Date of birth (format: Mon DD, YYYY or similar)
                    if ',' in text and any(m in text for m in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']):
                        player['dob'] = text
                    
                    # Market value
                    if '€' in text or ('m' in text.lower() and any(c.isdigit() for c in text)):
                        if 'market_value' not in player:
                            player['market_value'] = text
                
                # Nationality from flags
                flags = row.find_all('img', class_='flaggenrahmen')
                nationalities = []
                for flag in flags:
                    nat = flag.get('title', '')
                    if nat and nat not in nationalities:
                        nationalities.append(nat)
                if nationalities:
                    player['nationality'] = nationalities[0] if len(nationalities) == 1 else nationalities
                
                # Shirt number
                shirt = row.find('div', class_='rn_nummer')
                if shirt:
                    player['shirt_number'] = shirt.get_text(strip=True)
                
                if player.get('name'):
                    players.append(player)
                    
            except Exception as e:
                continue
        
        return players
        
    except Exception as e:
        print(f"      Error fetching roster: {e}")
        return []

def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    progress_file = os.path.join(output_dir, 'full_roster_progress.json')
    output_file = os.path.join(output_dir, 'all_players.json')
    
    all_players = []
    completed_leagues = []
    completed_teams = set()
    
    # Load progress
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            progress = json.load(f)
            all_players = progress.get('players', [])
            completed_leagues = progress.get('completed_leagues', [])
            completed_teams = set(progress.get('completed_teams', []))
            print(f"Resuming: {len(all_players)} players, {len(completed_leagues)} leagues done")
    
    print(f"\nFull Roster Scraper started at {datetime.now()}")
    print(f"Leagues to process: {len(LEAGUES)}")
    
    for league_name, league_code, _ in LEAGUES:
        if league_code in completed_leagues:
            print(f"\nSkipping {league_name} - already done")
            continue
        
        print(f"\n{'='*60}")
        print(f"League: {league_name} ({league_code})")
        print(f"{'='*60}")
        
        # Get teams
        print("  Fetching teams...")
        teams = get_teams_in_league(league_code)
        print(f"  Found {len(teams)} teams")
        
        if not teams:
            print("  No teams found, skipping")
            completed_leagues.append(league_code)
            continue
        
        time.sleep(random.uniform(2, 4))
        
        league_players = 0
        for i, team in enumerate(teams):
            team_key = f"{league_code}_{team['id']}"
            
            if team_key in completed_teams:
                continue
            
            print(f"  [{i+1}/{len(teams)}] {team['name']}...")
            
            players = get_team_roster(team)
            
            # Add league info to each player
            for p in players:
                p['league'] = league_name
                p['league_code'] = league_code
            
            all_players.extend(players)
            league_players += len(players)
            completed_teams.add(team_key)
            
            print(f"    Got {len(players)} players")
            
            # Save progress every 5 teams
            if (i + 1) % 5 == 0:
                progress = {
                    'players': all_players,
                    'completed_leagues': completed_leagues,
                    'completed_teams': list(completed_teams),
                    'last_update': datetime.now().isoformat()
                }
                with open(progress_file, 'w', encoding='utf-8') as f:
                    json.dump(progress, f, ensure_ascii=False)
                print(f"    [Progress saved: {len(all_players)} total players]")
            
            # Rate limiting
            time.sleep(random.uniform(3, 5))
        
        completed_leagues.append(league_code)
        print(f"  League total: {league_players} players")
        
        # Save progress after each league
        progress = {
            'players': all_players,
            'completed_leagues': completed_leagues,
            'completed_teams': list(completed_teams),
            'last_update': datetime.now().isoformat()
        }
        with open(progress_file, 'w', encoding='utf-8') as f:
            json.dump(progress, f, ensure_ascii=False)
        
        print(f"\nTotal players so far: {len(all_players)}")
        
        # Delay between leagues
        time.sleep(random.uniform(5, 10))
    
    # Final save
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_players, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"DONE! Scraped {len(all_players)} total players")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()

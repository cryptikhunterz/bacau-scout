"""
Fast enrichment: scrape roster pages to fill age/position.
Age format on TM: "May 9, 2000 (25)" in td[5] with class 'zentriert'
Position: td[4] plain text
"""
import json
import requests
from bs4 import BeautifulSoup
import time
import re
import os
import sys

def get_current_season():
    """Calculate Transfermarkt season year dynamically.
    TM uses start year: Aug 2025 onward = 2025, before Aug 2025 = 2024."""
    from datetime import datetime
    now = datetime.now()
    return now.year if now.month >= 8 else now.year - 1


HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.5',
}

BASE_URL = "https://www.transfermarkt.us"
LEAGUES = [
    'RO1', 'RO2', 'RO3', 'SER1', 'SER2', 'KR1', 'KR2', 'BOS1', 'ALB1', 'KOS1',
    'MNE1', 'SL1', 'SL2', 'PL1', 'PL2', 'TS1', 'TS2', 'SK1', 'A1', 'A2',
    'GB1', 'GB2', 'ES1', 'ES2', 'IT1', 'IT2', 'FR1', 'FR2', 'L1', 'L2',
    'NL1', 'NL2', 'PO1', 'PO2', 'BE1', 'BE2',
    'IT3A', 'IT3B', 'IT3C', 'PO3', 'FR3', 'FR4', 'ES3', 'ES4',
    'FI1', 'LI1', 'EST1', 'MNP3',
]

session = requests.Session()
session.headers.update(HEADERS)

def fetch(url, retries=3):
    for i in range(retries):
        try:
            time.sleep(1.0 + i * 0.5)
            resp = session.get(url, timeout=30)
            if resp.status_code == 200:
                return resp.text
            elif resp.status_code == 429:
                print(f"  Rate limited! Waiting 60s...", flush=True)
                time.sleep(60)
            elif resp.status_code == 404:
                return None
        except Exception as e:
            print(f"  Error: {e}", flush=True)
            time.sleep(3)
    return None

def get_teams(league_code):
    url = f"{BASE_URL}/wettbewerb/startseite/wettbewerb/{league_code}"
    html = fetch(url)
    if not html:
        return []
    soup = BeautifulSoup(html, 'html.parser')
    teams = []
    seen = set()
    for link in soup.find_all('a', href=lambda x: x and '/startseite/verein/' in str(x)):
        href = link.get('href', '')
        match = re.search(r'/verein/(\d+)', href)
        if match and match.group(1) not in seen:
            seen.add(match.group(1))
            name = link.get('title') or link.get_text(strip=True)
            # Get the slug from URL for roster page
            slug_match = re.match(r'/([^/]+)/startseite', href)
            slug = slug_match.group(1) if slug_match else None
            if name and len(name) > 1:
                teams.append({'id': match.group(1), 'name': name, 'slug': slug})
    return teams

def get_roster_data(team):
    """Get player age + position from roster table"""
    slug = team['slug'] or 'team'
    url = f"{BASE_URL}/{slug}/kader/verein/{team['id']}/saison_id/{get_current_season()}/plus/1"
    html = fetch(url)
    if not html:
        return {}
    
    soup = BeautifulSoup(html, 'html.parser')
    player_data = {}
    
    table = soup.find('table', class_='items')
    if not table:
        return {}
    
    rows = table.find_all('tr')
    for row in rows:
        # Find player ID from link
        link = row.find('a', href=lambda x: x and '/profil/spieler/' in str(x))
        if not link:
            continue
        match = re.search(r'/spieler/(\d+)', link['href'])
        if not match:
            continue
        pid = match.group(1)
        if pid in player_data:
            continue
        
        cells = row.find_all('td')
        data = {}
        
        for cell in cells:
            text = cell.get_text(strip=True)
            classes = ' '.join(cell.get('class', []))
            
            # Age: look for date format "Mon DD, YYYY (age)" 
            age_match = re.search(r'\((\d{1,2})\)\s*$', text)
            if age_match and 'age' not in data:
                age = int(age_match.group(1))
                if 13 <= age <= 50:
                    data['age'] = age
                    data['dob'] = text.split('(')[0].strip()
            
            # Position: plain text cell with known position names
            if text in ['Goalkeeper', 'Defender', 'Midfield', 'Attack',
                       'Centre-Back', 'Left-Back', 'Right-Back',
                       'Defensive Midfield', 'Central Midfield', 'Attacking Midfield',
                       'Left Winger', 'Right Winger', 'Centre-Forward',
                       'Second Striker', 'Left Midfield', 'Right Midfield']:
                data['position'] = text
            
            # Height
            height_match = re.match(r'^(\d,\d{2})\s*m$', text)
            if height_match:
                data['height'] = text
            
            # Foot
            if text in ['right', 'left', 'both']:
                data['foot'] = text
        
        if data:
            player_data[pid] = data
    
    return player_data

def main():
    json_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'players.json')
    
    with open(json_path) as f:
        players = json.load(f)
    
    # Build lookup by player_id
    pid_to_idx = {}
    for i, p in enumerate(players):
        pid = p.get('player_id') or p.get('playerId')
        if pid:
            pid_to_idx[pid] = i
    
    missing_age = sum(1 for p in players if p.get('age') is None)
    missing_pos = sum(1 for p in players if not p.get('position'))
    print(f"Before: {len(players)} players, {missing_age} missing age, {missing_pos} missing position", flush=True)
    
    enriched_age = 0
    enriched_pos = 0
    enriched_height = 0
    enriched_foot = 0
    total_teams = 0
    
    for league_code in LEAGUES:
        teams = get_teams(league_code)
        print(f"\n{league_code}: {len(teams)} teams", flush=True)
        
        for team in teams:
            total_teams += 1
            roster = get_roster_data(team)
            
            matched = 0
            for pid, data in roster.items():
                if pid in pid_to_idx:
                    idx = pid_to_idx[pid]
                    matched += 1
                    
                    if 'age' in data and players[idx].get('age') is None:
                        players[idx]['age'] = data['age']
                        enriched_age += 1
                    
                    if 'position' in data and not players[idx].get('position'):
                        players[idx]['position'] = data['position']
                        enriched_pos += 1
                    
                    if 'dob' in data and not players[idx].get('date_of_birth'):
                        players[idx]['date_of_birth'] = data['dob']
                    
                    if 'height' in data and not players[idx].get('height'):
                        players[idx]['height'] = data['height']
                        enriched_height += 1
                    
                    if 'foot' in data and not players[idx].get('foot'):
                        players[idx]['foot'] = data['foot']
                        enriched_foot += 1
            
            if total_teams % 5 == 0:
                print(f"  [{total_teams}] {team['name']}: {len(roster)} players, {matched} matched | Age +{enriched_age} Pos +{enriched_pos}", flush=True)
        
        # Save after each league
        with open(json_path, 'w') as f:
            json.dump(players, f, ensure_ascii=False)
        still_missing = sum(1 for p in players if p.get('age') is None)
        print(f"  Saved! Age +{enriched_age} | Pos +{enriched_pos} | Height +{enriched_height} | Foot +{enriched_foot} | Still missing age: {still_missing}", flush=True)
    
    print(f"\nDone! Teams: {total_teams}", flush=True)
    print(f"Enriched: Age +{enriched_age}, Pos +{enriched_pos}, Height +{enriched_height}, Foot +{enriched_foot}", flush=True)

if __name__ == '__main__':
    main()

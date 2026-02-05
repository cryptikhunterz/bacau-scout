"""
Enrich existing player data with missing age/position from Transfermarkt roster pages.
Reads players.json, fills gaps, writes back.
"""
import json
import requests
from bs4 import BeautifulSoup
import time
import re
import os

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

BASE_URL = "https://www.transfermarkt.us"

def fetch(url, session, retries=3):
    for i in range(retries):
        try:
            time.sleep(1.2 + (i * 2))
            resp = session.get(url, timeout=30, headers=HEADERS)
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

def get_player_age_position(player_id, session):
    """Fetch age and position from player profile page"""
    url = f"{BASE_URL}/spieler/profil/spieler/{player_id}"
    html = fetch(url, session)
    if not html:
        return None, None, None
    
    soup = BeautifulSoup(html, 'html.parser')
    age = None
    position = None
    birth_date = None
    
    # Get position from detail
    pos_el = soup.find('li', class_='data-header__label', string=lambda x: x and 'Position' in str(x))
    if pos_el:
        pos_span = pos_el.find_next('span')
        if pos_span:
            position = pos_span.get_text(strip=True)
    
    # Try info table for age and position
    info_table = soup.find('div', class_='info-table')
    if info_table:
        labels = info_table.find_all('span', class_='info-table__content--regular')
        for label_el in labels:
            label = label_el.get_text(strip=True).lower().rstrip(':')
            value_el = label_el.find_next_sibling('span')
            if not value_el:
                continue
            value = value_el.get_text(strip=True)
            
            if 'date of birth' in label:
                birth_date = value.split('(')[0].strip()
                age_match = re.search(r'\((\d+)\)', value)
                if age_match:
                    age = int(age_match.group(1))
            elif 'position' in label and not position:
                position = value
    
    return age, position, birth_date

def main():
    json_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'players.json')
    
    with open(json_path) as f:
        players = json.load(f)
    
    print(f"Total players: {len(players)}")
    
    # Find players missing age or position
    missing = []
    for i, p in enumerate(players):
        has_age = p.get('age') is not None
        has_pos = bool(p.get('position'))
        pid = p.get('player_id') or p.get('playerId')
        
        if pid and (not has_age or not has_pos):
            missing.append((i, pid, not has_age, not has_pos))
    
    print(f"Missing data: {len(missing)} players")
    print(f"  Missing age: {sum(1 for _,_,a,_ in missing if a)}")
    print(f"  Missing position: {sum(1 for _,_,_,p in missing if p)}")
    
    session = requests.Session()
    enriched = 0
    errors = 0
    
    for count, (idx, pid, needs_age, needs_pos) in enumerate(missing):
        if count % 100 == 0:
            print(f"Progress: {count}/{len(missing)} (enriched: {enriched}, errors: {errors})")
            # Save periodically
            if count > 0 and count % 500 == 0:
                with open(json_path, 'w') as f:
                    json.dump(players, f, ensure_ascii=False)
                print(f"  Saved checkpoint at {count}")
        
        age, position, birth_date = get_player_age_position(pid, session)
        
        if age or position:
            if age and needs_age:
                players[idx]['age'] = age
            if position and needs_pos:
                players[idx]['position'] = position
            if birth_date:
                players[idx]['date_of_birth'] = birth_date
            enriched += 1
        else:
            errors += 1
        
        name = players[idx].get('name', 'Unknown')
        if count < 10 or count % 50 == 0:
            print(f"  [{count}] {name}: age={age}, pos={position}")
    
    # Final save
    with open(json_path, 'w') as f:
        json.dump(players, f, ensure_ascii=False)
    
    print(f"\nDone! Enriched {enriched}/{len(missing)} players. Errors: {errors}")

if __name__ == '__main__':
    main()

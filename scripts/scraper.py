#!/usr/bin/env python3
"""
Transfermarkt scraper for Bacau Scout
Scrapes player data from market value pages for specified leagues.
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os
from datetime import datetime

# Headers to mimic a browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
}

# Leagues to scrape with their Transfermarkt codes
# Format: (name, code, description)
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
    ("Kosovo Superliga", "KOS1", "superliga"),
    ("Montenegro 1. CFL", "MNE1", "1-cfl"),
    ("Slovenia 1. SNL", "SL1", "prva-liga"),
    ("Slovenia 2. SNL", "SL2", "druga-liga"),
    ("Bosnia Premier Liga", "BOS1", "premijer-liga"),
    
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
    ("Poland 1. Liga", "PL2", "betclic-1-liga"),
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

def get_league_url(code, page=1):
    """Build the URL for a league's market value page"""
    return f"https://www.transfermarkt.com/wettbewerb/marktwerte/wettbewerb/{code}/page/{page}"

def parse_market_value_page(html, league_url):
    """Parse players from a market value page"""
    soup = BeautifulSoup(html, 'lxml')
    players = []
    
    # Find player rows in the table
    table = soup.find('table', class_='items')
    if not table:
        return players
    
    rows = table.find_all('tr', class_=['odd', 'even'])
    
    for row in rows:
        try:
            # Player name and position
            player_cell = row.find('td', class_='hauptlink')
            if not player_cell:
                continue
            
            name_link = player_cell.find('a')
            if not name_link:
                continue
            
            name = name_link.get_text(strip=True)
            
            # Position (in a separate row below or in td)
            position = ""
            pos_cell = row.find_all('td')
            for td in pos_cell:
                if td.get_text(strip=True) and 'posrela' in str(td):
                    position = td.get_text(strip=True)
                    break
            
            # Try to find position in inline-table
            inline_table = row.find('table', class_='inline-table')
            if inline_table:
                tds = inline_table.find_all('td')
                if len(tds) >= 2:
                    position = tds[1].get_text(strip=True) if tds[1] else ""
            
            # Age
            age = ""
            for td in row.find_all('td'):
                text = td.get_text(strip=True)
                if text.isdigit() and 14 <= int(text) <= 45:
                    age = text
                    break
            
            # Club
            club = ""
            club_links = row.find_all('a', href=lambda x: x and '/startseite/verein/' in x)
            for link in club_links:
                club_text = link.get_text(strip=True)
                if club_text and len(club_text) > 1:
                    club = club_text
                    break
            
            # Market value
            market_value = ""
            value_cell = row.find('td', class_='rechts hauptlink')
            if value_cell:
                market_value = value_cell.get_text(strip=True)
            
            # Nationality
            nationality = []
            flag_imgs = row.find_all('img', class_='flaggenrahmen')
            for img in flag_imgs:
                nat = img.get('title', '')
                if nat and nat not in nationality:
                    nationality.append(nat)
            
            if name:
                player = {
                    "Player": [name, position],
                    "Age": age,
                    "Club": club,
                    "Market value": market_value,
                    "givenUrl": league_url,
                    "Nat.": nationality[0] if len(nationality) == 1 else nationality if nationality else ""
                }
                players.append(player)
                
        except Exception as e:
            print(f"Error parsing row: {e}")
            continue
    
    return players

def has_next_page(html):
    """Check if there's a next page"""
    soup = BeautifulSoup(html, 'lxml')
    pager = soup.find('div', class_='pager')
    if pager:
        next_link = pager.find('a', class_='tm-pagination__link', title='Go to next page')
        return next_link is not None
    return False

def scrape_league(name, code, delay_min=3, delay_max=6):
    """Scrape all players from a league"""
    all_players = []
    page = 1
    base_url = f"https://www.transfermarkt.com/wettbewerb/marktwerte/wettbewerb/{code}"
    
    print(f"\n{'='*60}")
    print(f"Scraping: {name} ({code})")
    print(f"{'='*60}")
    
    while True:
        url = f"{base_url}/page/{page}"
        print(f"  Page {page}: {url}")
        
        try:
            response = requests.get(url, headers=HEADERS, timeout=30)
            
            if response.status_code != 200:
                print(f"  Error: HTTP {response.status_code}")
                break
            
            players = parse_market_value_page(response.text, base_url)
            
            if not players:
                print(f"  No players found on page {page}, stopping")
                break
            
            all_players.extend(players)
            print(f"  Found {len(players)} players (total: {len(all_players)})")
            
            # Check for next page
            if not has_next_page(response.text):
                print(f"  No more pages")
                break
            
            page += 1
            
            # Rate limiting
            delay = random.uniform(delay_min, delay_max)
            print(f"  Waiting {delay:.1f}s...")
            time.sleep(delay)
            
        except Exception as e:
            print(f"  Error: {e}")
            break
    
    return all_players

def save_progress(players, filename):
    """Save current progress to file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(players, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(players)} players to {filename}")

def main():
    """Main scraping function"""
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(output_dir, 'scraped_players.json')
    progress_file = os.path.join(output_dir, 'scrape_progress.json')
    
    all_players = []
    completed_leagues = []
    
    # Load existing progress if any
    if os.path.exists(progress_file):
        with open(progress_file, 'r') as f:
            progress = json.load(f)
            all_players = progress.get('players', [])
            completed_leagues = progress.get('completed', [])
            print(f"Resuming from progress: {len(all_players)} players, {len(completed_leagues)} leagues done")
    
    print(f"\nStarting scraper at {datetime.now()}")
    print(f"Total leagues to scrape: {len(LEAGUES)}")
    
    for name, code, _ in LEAGUES:
        if code in completed_leagues:
            print(f"\nSkipping {name} ({code}) - already done")
            continue
        
        try:
            players = scrape_league(name, code)
            all_players.extend(players)
            completed_leagues.append(code)
            
            # Save progress after each league
            progress = {
                'players': all_players,
                'completed': completed_leagues,
                'last_update': datetime.now().isoformat()
            }
            with open(progress_file, 'w', encoding='utf-8') as f:
                json.dump(progress, f, indent=2, ensure_ascii=False)
            
            print(f"\nTotal players so far: {len(all_players)}")
            
            # Longer delay between leagues
            delay = random.uniform(10, 20)
            print(f"Waiting {delay:.1f}s before next league...")
            time.sleep(delay)
            
        except KeyboardInterrupt:
            print("\n\nInterrupted! Saving progress...")
            save_progress(all_players, output_file)
            break
        except Exception as e:
            print(f"\nError scraping {name}: {e}")
            continue
    
    # Final save
    save_progress(all_players, output_file)
    print(f"\n{'='*60}")
    print(f"DONE! Scraped {len(all_players)} total players")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()

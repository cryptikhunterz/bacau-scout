#!/usr/bin/env python3
"""
Transfermarkt Detail Scraper for Bacau Scout
Gets full player profiles: stats, contract, history, etc.
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os
import re
from datetime import datetime
from urllib.parse import quote

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
}

def search_player(name, club=None):
    """Search for a player and return their profile URL"""
    search_url = f"https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query={quote(name)}"
    
    try:
        response = requests.get(search_url, headers=HEADERS, timeout=30)
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.text, 'lxml')
        
        # Find player results table
        player_table = soup.find('table', class_='items')
        if not player_table:
            return None
        
        rows = player_table.find_all('tr', class_=['odd', 'even'])
        
        for row in rows:
            link = row.find('a', href=lambda x: x and '/profil/spieler/' in x)
            if link:
                href = link.get('href')
                # If club specified, try to match
                if club:
                    row_text = row.get_text().lower()
                    if club.lower() in row_text:
                        return f"https://www.transfermarkt.com{href}"
                else:
                    return f"https://www.transfermarkt.com{href}"
        
        # Return first result if no club match
        first_link = player_table.find('a', href=lambda x: x and '/profil/spieler/' in x)
        if first_link:
            return f"https://www.transfermarkt.com{first_link.get('href')}"
            
    except Exception as e:
        print(f"    Search error: {e}")
    
    return None

def parse_player_profile(html, url):
    """Parse detailed player info from profile page"""
    soup = BeautifulSoup(html, 'lxml')
    details = {}
    
    # Basic info from header
    header = soup.find('header', class_='data-header')
    if header:
        # Full name
        name_h1 = header.find('h1', class_='data-header__headline-wrapper')
        if name_h1:
            details['full_name'] = name_h1.get_text(strip=True)
        
        # Shirt number
        shirt = header.find('span', class_='data-header__shirt-number')
        if shirt:
            details['shirt_number'] = shirt.get_text(strip=True).replace('#', '')
    
    # Info table (right side)
    info_table = soup.find('div', class_='info-table')
    if info_table:
        rows = info_table.find_all('span', class_='info-table__content')
        labels = info_table.find_all('span', class_='info-table__content--regular')
        
        for i, label in enumerate(labels):
            label_text = label.get_text(strip=True).lower()
            if i < len(rows):
                value = rows[i].get_text(strip=True)
                
                if 'date of birth' in label_text or 'birth' in label_text:
                    details['date_of_birth'] = value
                elif 'place of birth' in label_text:
                    details['place_of_birth'] = value
                elif 'height' in label_text:
                    details['height'] = value
                elif 'citizenship' in label_text:
                    details['citizenship'] = value
                elif 'position' in label_text:
                    details['position'] = value
                elif 'foot' in label_text:
                    details['foot'] = value
                elif 'agent' in label_text:
                    details['agent'] = value
                elif 'outfitter' in label_text:
                    details['outfitter'] = value
    
    # Alternative: parse from data-header__items
    header_items = soup.find_all('li', class_='data-header__label')
    for item in header_items:
        text = item.get_text(strip=True)
        if 'Current club' in text or 'club:' in text.lower():
            club_link = item.find('a')
            if club_link:
                details['current_club'] = club_link.get_text(strip=True)
        elif 'Contract expires' in text:
            details['contract_expires'] = text.replace('Contract expires:', '').strip()
    
    # Player data box
    data_box = soup.find('div', class_='data-header__box')
    if data_box:
        items = data_box.find_all('li')
        for item in items:
            text = item.get_text(strip=True)
            if 'Contract expires' in text:
                details['contract_expires'] = text.replace('Contract expires:', '').strip()
            elif 'Joined' in text:
                details['joined'] = text.replace('Joined:', '').strip()
    
    # Market value
    mv_div = soup.find('div', class_='data-header__market-value-wrapper')
    if mv_div:
        value = mv_div.find('a', class_='data-header__market-value-wrapper')
        if value:
            details['market_value'] = value.get_text(strip=True).split('Last')[0].strip()
    
    # Stats section
    stats_box = soup.find('div', {'data-viewport': 'Leistungsdaten'})
    if stats_box:
        stats = {}
        rows = stats_box.find_all('div', class_='tm-player-performance')
        # Alternative parsing for stats
        
    # Career stats from performance data
    perf_table = soup.find('table', class_='items')
    if perf_table:
        career_stats = []
        rows = perf_table.find_all('tr', class_=['odd', 'even'])
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 5:
                season_data = {
                    'season': cells[0].get_text(strip=True) if cells[0] else '',
                    'competition': cells[1].get_text(strip=True) if len(cells) > 1 else '',
                    'appearances': cells[3].get_text(strip=True) if len(cells) > 3 else '',
                    'goals': cells[4].get_text(strip=True) if len(cells) > 4 else '',
                    'assists': cells[5].get_text(strip=True) if len(cells) > 5 else '',
                }
                if season_data['season']:
                    career_stats.append(season_data)
        if career_stats:
            details['career_stats'] = career_stats
    
    # Transfer history
    transfer_table = soup.find('div', class_='transferhistorie')
    if transfer_table:
        transfers = []
        rows = transfer_table.find_all('div', class_='tm-player-transfer-history-grid')
        for row in rows:
            transfer = {}
            # Parse transfer data
            transfers.append(transfer)
        if transfers:
            details['transfer_history'] = transfers
    
    details['profile_url'] = url
    details['scraped_at'] = datetime.now().isoformat()
    
    return details

def get_player_details(url):
    """Fetch and parse a player's full profile"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        if response.status_code != 200:
            return None
        return parse_player_profile(response.text, url)
    except Exception as e:
        print(f"    Error fetching profile: {e}")
        return None

def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    players_file = os.path.join(output_dir, 'scraped_players.json')
    details_file = os.path.join(output_dir, 'player_details.json')
    progress_file = os.path.join(output_dir, 'details_progress.json')
    
    # Load scraped players
    with open(players_file, 'r', encoding='utf-8') as f:
        players = json.load(f)
    
    print(f"Loaded {len(players)} players")
    
    # Load existing progress
    detailed_players = []
    completed_names = set()
    
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            progress = json.load(f)
            detailed_players = progress.get('players', [])
            completed_names = set(progress.get('completed', []))
            print(f"Resuming: {len(detailed_players)} players already done")
    
    print(f"\nStarting detail scraper at {datetime.now()}")
    
    for i, player in enumerate(players):
        name = player['Player'][0] if isinstance(player['Player'], list) else player['Player']
        
        if name in completed_names:
            continue
        
        print(f"\n[{i+1}/{len(players)}] {name}")
        
        # Search for player URL
        print(f"  Searching...")
        url = search_player(name, player.get('Club'))
        
        if not url:
            print(f"  Not found, skipping")
            completed_names.add(name)
            continue
        
        time.sleep(random.uniform(2, 4))
        
        # Get details
        print(f"  Fetching profile: {url}")
        details = get_player_details(url)
        
        if details:
            # Merge with original data
            merged = {**player, **details}
            detailed_players.append(merged)
            print(f"  ✓ Got details")
        else:
            # Keep original data
            detailed_players.append(player)
            print(f"  ✗ No details, keeping basic")
        
        completed_names.add(name)
        
        # Save progress every 10 players
        if len(detailed_players) % 10 == 0:
            progress = {
                'players': detailed_players,
                'completed': list(completed_names),
                'last_update': datetime.now().isoformat()
            }
            with open(progress_file, 'w', encoding='utf-8') as f:
                json.dump(progress, f, indent=2, ensure_ascii=False)
            print(f"\n  Saved progress: {len(detailed_players)} players")
        
        # Rate limiting
        delay = random.uniform(3, 6)
        time.sleep(delay)
    
    # Final save
    with open(details_file, 'w', encoding='utf-8') as f:
        json.dump(detailed_players, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"DONE! {len(detailed_players)} players with details")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()

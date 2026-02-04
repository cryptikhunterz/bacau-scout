#!/usr/bin/env python3
"""
COMPREHENSIVE Transfermarkt Scraper
Gets EVERYTHING: profile, stats by season, transfer history.
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

PROGRESS_FILE = 'everything_progress.json'
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
    """Scrape profile page: photo, DOB, height, foot, position, market value, etc."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        soup = BeautifulSoup(resp.text, 'lxml')
        profile = {}
        
        # Photo
        photo_el = soup.select_one('img.data-header__profile-image')
        if photo_el:
            profile['photo_url'] = photo_el.get('src', '')
        
        # Shirt number
        shirt = soup.select_one('span.data-header__shirt-number')
        if shirt:
            profile['shirt_number'] = shirt.text.strip().replace('#', '')
        
        # Info table
        for row in soup.select('div.info-table span.info-table__content--regular'):
            label = row.text.strip().lower().rstrip(':')
            value_el = row.find_next_sibling('span')
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
            elif 'joined' in label:
                profile['joined'] = value
            elif 'contract expires' in label:
                profile['contract_expires'] = value
        
        # Market value
        mv_el = soup.select_one('a.data-header__market-value-wrapper')
        if mv_el:
            profile['market_value_full'] = mv_el.text.strip()
        
        # Position from detail box
        pos_el = soup.select_one('div.detail-position__position')
        if pos_el:
            profile['main_position'] = pos_el.text.strip()
        
        return profile
    except Exception as e:
        print(f"Profile error: {e}")
        return {}

def scrape_stats(profile_url):
    """Scrape stats page: career totals + season-by-season"""
    try:
        # Convert profile URL to stats URL
        stats_url = profile_url.replace('/profil/', '/leistungsdaten/') + '/saison//verein/0/liga/0/wettbewerb//pos/0/trainer_id/0/plus/1'
        
        resp = requests.get(stats_url, headers=HEADERS, timeout=30)
        soup = BeautifulSoup(resp.text, 'lxml')
        
        stats = {
            'career_totals': {},
            'season_stats': []
        }
        
        # Career totals from footer
        for row in soup.select('tfoot tr'):
            cells = row.select('td')
            if len(cells) >= 12:
                first = cells[0].text.strip().lower()
                if 'total' in first:
                    try:
                        stats['career_totals'] = {
                            'appearances': int(cells[2].text.strip() or 0),
                            'goals': int(cells[7].text.strip() or 0),
                            'assists': int(cells[9].text.strip() or 0),
                            'yellow_cards': int(cells[10].text.strip() or 0),
                            'second_yellow': int(cells[11].text.strip() or 0),
                            'minutes': int(cells[12].text.strip().replace("'", "").replace(".", "") or 0) if len(cells) > 12 else 0
                        }
                    except:
                        pass
                    break
        
        # Season-by-season stats
        for row in soup.select('table.items tbody tr'):
            cells = row.select('td')
            if len(cells) < 5:
                continue
            
            season = {}
            
            # Season
            season_cell = row.select_one('td.zentriert a')
            if season_cell:
                season['season'] = season_cell.text.strip()
            
            # Competition
            comp_cell = row.select_one('td.hauptlink a')
            if comp_cell:
                season['competition'] = comp_cell.text.strip()
            
            # Club
            club_cell = row.select_one('td.no-border-links a')
            if club_cell:
                season['club'] = club_cell.text.strip()
            
            # Stats (appearances, goals, assists, etc.)
            num_cells = row.select('td.zentriert')
            if len(num_cells) >= 4:
                try:
                    season['appearances'] = int(num_cells[-4].text.strip() or 0)
                except:
                    season['appearances'] = 0
                try:
                    season['goals'] = int(num_cells[-3].text.strip() or 0)
                except:
                    season['goals'] = 0
                try:
                    season['assists'] = int(num_cells[-2].text.strip() or 0)
                except:
                    season['assists'] = 0
                try:
                    mins = num_cells[-1].text.strip().replace("'", "").replace(".", "")
                    season['minutes'] = int(mins or 0)
                except:
                    season['minutes'] = 0
            
            if season.get('season'):
                stats['season_stats'].append(season)
        
        return stats
    except Exception as e:
        print(f"Stats error: {e}")
        return {'career_totals': {}, 'season_stats': []}

def scrape_transfers(profile_url):
    """Scrape transfer history"""
    try:
        # Convert to transfers URL
        transfers_url = profile_url.replace('/profil/', '/transfers/')
        
        resp = requests.get(transfers_url, headers=HEADERS, timeout=30)
        soup = BeautifulSoup(resp.text, 'lxml')
        
        transfers = []
        
        for row in soup.select('div.tm-transfer-history tbody tr, table.transfer-history tbody tr'):
            transfer = {}
            
            # Season
            season_el = row.select_one('td:first-child')
            if season_el:
                transfer['season'] = season_el.text.strip()
            
            # Date
            date_el = row.select_one('td.zentriert')
            if date_el:
                transfer['date'] = date_el.text.strip()
            
            # From club
            clubs = row.select('td.no-border-links a, td.vereinsname a')
            if len(clubs) >= 1:
                transfer['from_club'] = clubs[0].text.strip()
            if len(clubs) >= 2:
                transfer['to_club'] = clubs[1].text.strip()
            
            # Fee
            fee_el = row.select_one('td.rechts a, td.transfer-fee')
            if fee_el:
                transfer['fee'] = fee_el.text.strip()
            
            if transfer.get('season') or transfer.get('date'):
                transfers.append(transfer)
        
        return transfers
    except Exception as e:
        print(f"Transfers error: {e}")
        return []

def scrape_player_everything(profile_url):
    """Scrape ALL data for a player"""
    data = {}
    
    # 1. Profile
    profile = scrape_profile(profile_url)
    data.update(profile)
    time.sleep(1)
    
    # 2. Stats
    stats = scrape_stats(profile_url)
    data['career_totals'] = stats.get('career_totals', {})
    data['season_stats'] = stats.get('season_stats', [])
    time.sleep(1)
    
    # 3. Transfers
    transfers = scrape_transfers(profile_url)
    data['transfer_history'] = transfers
    
    return data

def main():
    print("=" * 60)
    print("COMPREHENSIVE SCRAPER - EVERYTHING")
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
        
        try:
            full_data = scrape_player_everything(url)
            player.update(full_data)
            completed_ids.add(player_id)
            processed += 1
            
            totals = full_data.get('career_totals', {})
            apps = totals.get('appearances', '?')
            goals = totals.get('goals', '?')
            seasons = len(full_data.get('season_stats', []))
            transfers = len(full_data.get('transfer_history', []))
            
            print(f"✓ apps:{apps} goals:{goals} seasons:{seasons} transfers:{transfers}")
        except Exception as e:
            errors += 1
            print(f"✗ {e}")
        
        # Save every 25 players (more frequent due to more data)
        if processed % 25 == 0 and processed > 0:
            progress['completed_ids'] = list(completed_ids)
            save_progress(progress)
            save_players(data)
            print(f"   [Saved: {len(completed_ids)} done]")
        
        # Rate limit - 2 sec between players (already has internal delays)
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

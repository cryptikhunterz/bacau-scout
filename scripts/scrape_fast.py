#!/usr/bin/env python3
"""
Fast parallel scraper - 10 workers, 0.5s delay
Risk: might get rate limited, but way faster
"""

import json
import time
import random
import re
import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
}

progress_lock = Lock()
stats = {'done': 0, 'failed': 0, 'blocked': 0}

def scrape_player_stats(player):
    """Scrape stats for a single player"""
    if player.get('apps') is not None:
        return player  # Already has stats
    
    url = player.get('url', '')
    if not url:
        return player
    
    try:
        time.sleep(random.uniform(0.3, 0.8))  # Short random delay
        
        resp = requests.get(url, headers=HEADERS, timeout=15)
        
        if resp.status_code == 429 or 'blocked' in resp.text.lower():
            with progress_lock:
                stats['blocked'] += 1
            return player
            
        if resp.status_code != 200:
            return player
            
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Get career totals from data-header
        header = soup.find('div', class_='data-header__details')
        
        # Try to find stats box
        stats_box = soup.find('div', class_='data-header__box--big')
        if stats_box:
            spans = stats_box.find_all('span')
            for i, span in enumerate(spans):
                text = span.get_text(strip=True).lower()
                if 'appearances' in text or 'games' in text:
                    try:
                        player['apps'] = int(re.sub(r'\D', '', spans[i-1].get_text()) or 0)
                    except:
                        pass
                elif 'goals' in text:
                    try:
                        player['goals'] = int(re.sub(r'\D', '', spans[i-1].get_text()) or 0)
                    except:
                        pass
        
        # Try performance data table
        perf_table = soup.find('div', {'data-viewport': 'Leistungsdaten_498'}) or soup.find('table', class_='items')
        if perf_table:
            rows = perf_table.find_all('tr')
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 5:
                    try:
                        # Usually: competition, apps, goals, assists, minutes
                        if 'total' in row.get_text().lower():
                            player['apps'] = int(re.sub(r'\D', '', cells[1].get_text()) or 0)
                            player['goals'] = int(re.sub(r'\D', '', cells[2].get_text()) or 0)
                            player['assists'] = int(re.sub(r'\D', '', cells[3].get_text()) or 0)
                    except:
                        pass
        
        # Extract height and foot
        info_table = soup.find('table', class_='auflistung')
        if info_table:
            for row in info_table.find_all('tr'):
                label = row.find('th')
                value = row.find('td')
                if label and value:
                    label_text = label.get_text(strip=True).lower()
                    value_text = value.get_text(strip=True)
                    if 'height' in label_text:
                        match = re.search(r'(\d+)', value_text.replace(',', ''))
                        if match:
                            player['height'] = int(match.group(1))
                    elif 'foot' in label_text:
                        player['foot'] = value_text
        
        with progress_lock:
            stats['done'] += 1
            
    except Exception as e:
        with progress_lock:
            stats['failed'] += 1
    
    return player

def main():
    print("=" * 60)
    print("FAST PARALLEL SCRAPER - 10 workers")
    print("=" * 60)
    
    # Load progress
    with open('complete_progress.json', 'r') as f:
        data = json.load(f)
    
    players = data['players']
    
    # Filter to those needing stats
    need_stats = [p for p in players if p.get('apps') is None]
    already_done = len(players) - len(need_stats)
    
    print(f"Total players: {len(players)}")
    print(f"Already have stats: {already_done}")
    print(f"Need to scrape: {len(need_stats)}")
    print("=" * 60)
    
    start_time = time.time()
    results = []
    
    # Use 10 parallel workers
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(scrape_player_stats, p): p for p in need_stats}
        
        for i, future in enumerate(as_completed(futures)):
            result = future.result()
            results.append(result)
            
            # Progress every 100
            if (i + 1) % 100 == 0:
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed * 60  # per minute
                eta = (len(need_stats) - i - 1) / (rate / 60) / 60  # hours
                print(f"[{i+1}/{len(need_stats)}] Done: {stats['done']} | Failed: {stats['failed']} | Blocked: {stats['blocked']} | Rate: {rate:.0f}/min | ETA: {eta:.1f}h")
                
                # Save checkpoint
                updated_players = [p for p in players if p.get('apps') is not None]
                updated_players.extend([r for r in results if r.get('apps') is not None])
                
                if stats['blocked'] > 50:
                    print("\n⚠️  TOO MANY BLOCKS - Stopping to avoid IP ban")
                    break
    
    # Merge results back
    result_map = {r['url']: r for r in results if r.get('url')}
    for p in players:
        if p.get('url') in result_map:
            p.update(result_map[p['url']])
    
    # Save final
    data['players'] = players
    data['last_updated'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    with open('complete_progress.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    # Copy to public
    with open('../public/players.json', 'w') as f:
        json.dump(players, f)
    
    elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print(f"DONE in {elapsed/60:.1f} minutes")
    print(f"Scraped: {stats['done']} | Failed: {stats['failed']} | Blocked: {stats['blocked']}")
    print("=" * 60)

if __name__ == '__main__':
    main()

#!/usr/bin/env node
/**
 * Normalize league names in chunks and players-list.json
 * 
 * WS-only players use Wyscout comp field directly (e.g. "Romania. Liga II")
 * TM-matched players use friendlier names (e.g. "Romania Liga 2").
 * This script normalizes all to the friendly format.
 */
const fs = require('fs');
const path = require('path');

const CHUNKS_DIR = path.join(__dirname, '..', 'public', 'data', 'chunks');
const PLAYERS_LIST = path.join(__dirname, '..', 'public', 'data', 'players-list.json');

// Mapping from Wyscout format → friendly format
const LEAGUE_MAP = {
  'Romania. Liga II': 'Romania Liga 2',
  'Romania. Superliga': 'Romania Liga 1',
  'Italy. Serie B': 'Italy Serie B',
  'Italy. Serie C': 'Italy Serie C',
  'France. National 1': 'France National 1',
  'France. National 2': 'France National 2',
  'Portugal. Liga 3': 'Portugal Liga 3',
  'Portugal. Segunda Liga': 'Portugal Liga 2',
  'Spain. Primera Division RFEF': 'Spain Primera RFEF',
  'Austria. Bundesliga': 'Austria Bundesliga',
  'Austria. 2. Liga': 'Austria 2. Liga',
  'Poland. Ekstraklasa': 'Poland Ekstraklasa',
  'Poland. I Liga': 'Poland 1. Liga',
  'Czech Republic. Chance Liga': 'Czech 1. Liga',
  'Czech Republic. Chance National Liga': 'Czech 2. Liga',
  'Serbia. Super Liga': 'Serbia SuperLiga',
  'Serbia. Prva Liga': 'Serbia Prva Liga',
  'Croatia. First NL': 'Croatia 2. HNL',
  'Croatia. Superleague': 'Croatia 1. HNL',
  'Belgium. Challenger Pro League': 'Belgium Challenger Pro',
  'Netherlands. Eerste Divisie': 'Netherlands Eerste Divisie',
  'Slovakia. Niké Liga': 'Slovakia Nike Liga',
  'Slovenia. 1. SNL': 'Slovenia 1. SNL',
  'Slovenia. 2. SNL': 'Slovenia 2. SNL',
  'Albania. Abissnet Superiore': 'Albania Superiore',
  'Finland. Veikkausliiga': 'Finland Veikkausliiga',
  'Montenegro. First League': 'Montenegro 1. CFL',
  'Estonia. A.LeCoq Premium Liiga': 'Estonia Meistriliiga',
  'Lithuania. A Lyga': 'Lithuania A Lyga',
  'Bosnia and Herzegovina. Premijer Liga': 'Bosnia Premier Liga',
  'Kosovo. Superliga': 'Kosovo Superliga',
  'United States. MLS Next Pro': 'MLS Next Pro',
};

function normalizeLeague(lg) {
  if (!lg) return lg;
  return LEAGUE_MAP[lg] || lg;
}

// Fix chunk files
const chunkFiles = fs.readdirSync(CHUNKS_DIR).filter(f => f.endsWith('.json'));
let chunkFixed = 0;

for (const file of chunkFiles) {
  const filePath = path.join(CHUNKS_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;

  for (const [id, player] of Object.entries(data)) {
    const oldLg = player.lg;
    const newLg = normalizeLeague(oldLg);
    if (newLg !== oldLg) {
      player.lg = newLg;
      modified = true;
      chunkFixed++;
    }
    // Also normalize comp field
    const oldComp = player.comp;
    const newComp = normalizeLeague(oldComp);
    if (newComp !== oldComp) {
      player.comp = newComp;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
  }
}

// Fix players-list.json
const playersList = JSON.parse(fs.readFileSync(PLAYERS_LIST, 'utf8'));
let listFixed = 0;

for (const player of playersList) {
  const oldLg = player.lg;
  const newLg = normalizeLeague(oldLg);
  if (newLg !== oldLg) {
    player.lg = newLg;
    listFixed++;
  }
  const oldComp = player.comp;
  const newComp = normalizeLeague(oldComp);
  if (newComp !== oldComp) {
    player.comp = newComp;
  }
}

fs.writeFileSync(PLAYERS_LIST, JSON.stringify(playersList), 'utf8');

console.log('Done!');
console.log(`  Chunks: ${chunkFixed} player league names normalized`);
console.log(`  Players list: ${listFixed} league names normalized`);

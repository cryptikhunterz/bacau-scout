#!/usr/bin/env node
/**
 * Backfill empty chunk metrics from wyscout-percentiles.json
 * 
 * Players with m:{} (empty metrics) in chunks may have data in
 * wyscout-percentiles.json (keyed by TM player_id/pid).
 * This script populates m (raw values), p (league percentiles),
 * gp (global percentiles), and r (radar keys) from that data.
 */
const fs = require('fs');
const path = require('path');

const PERCENTILES_PATH = path.join(__dirname, '..', 'public', 'wyscout-percentiles.json');
const CHUNKS_DIR = path.join(__dirname, '..', 'public', 'data', 'chunks');

// Load percentiles (keyed by TM pid)
const percentiles = JSON.parse(fs.readFileSync(PERCENTILES_PATH, 'utf8'));

const chunkFiles = fs.readdirSync(CHUNKS_DIR).filter(f => f.endsWith('.json')).sort();

let totalFixed = 0;
let totalEmpty = 0;
let noMatch = 0;

for (const file of chunkFiles) {
  const filePath = path.join(CHUNKS_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;

  for (const [wsId, player] of Object.entries(data)) {
    const m = player.m;
    const isEmpty = !m || Object.keys(m).length === 0;
    
    if (!isEmpty) continue;
    totalEmpty++;

    const pid = player.pid;
    if (!pid) continue;

    const pctData = percentiles[String(pid)];
    if (!pctData) {
      noMatch++;
      continue;
    }

    // Build metrics from radar + allround arrays
    const newM = {};
    const newP = {};
    const newGP = {};
    const radarKeys = [];

    if (pctData.radar) {
      for (const item of pctData.radar) {
        newM[item.key] = item.value;
        newP[item.key] = item.percentile;
        newGP[item.key] = item.gp;
        radarKeys.push(item.key);
      }
    }

    if (pctData.allround) {
      for (const item of pctData.allround) {
        if (!(item.key in newM)) {
          newM[item.key] = item.value;
          newP[item.key] = item.percentile;
          newGP[item.key] = item.gp;
        }
      }
    }

    if (Object.keys(newM).length > 0) {
      player.m = newM;
      player.p = newP;
      player.gp = newGP;
      player.r = radarKeys;
      // Also update pg if missing
      if (!player.pg && pctData.pg) {
        player.pg = pctData.pg;
      }
      modified = true;
      totalFixed++;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
  }
}

console.log(`Done!`);
console.log(`  Empty metrics found: ${totalEmpty}`);
console.log(`  Fixed (backfilled): ${totalFixed}`);
console.log(`  No percentile match: ${noMatch}`);

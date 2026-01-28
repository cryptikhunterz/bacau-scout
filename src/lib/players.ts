import * as fs from 'fs';
import * as path from 'path';

// Raw player record from JSON (two possible formats)
export interface RawPlayer {
  // List format
  Player?: [string, string]; // [name, position]
  Age?: string;
  Club?: string;
  'Market value'?: string;
  givenUrl?: string;
  'Nat.'?: string | string[];

  // Profile format
  url?: string;
  type?: string;
  'Date of birth/Age'?: string;
  Position?: string;
  'Current club'?: string;
  Citizenship?: string | string[];
  Height?: string;
  Foot?: string;
  'Player agent'?: string;
}

// Normalized player for response
export interface NormalizedPlayer {
  name: string;
  position: string | null;
  age: string | null;
  club: string | null;
  marketValue: string | null;
  nationality: string[];
  url: string | null;
  playerId: string | null;
  leagueUrl: string | null;
}

// Cache the players in memory
let playersCache: NormalizedPlayer[] | null = null;

export function loadPlayers(): NormalizedPlayer[] {
  if (playersCache) return playersCache;

  const jsonPath = path.join(process.cwd(), 'Bacau scout prototype ', 'JSON 2.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('JSON file not found:', jsonPath);
    return [];
  }

  const rawData: RawPlayer[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  playersCache = rawData
    .map(normalizePlayer)
    .filter((p): p is NormalizedPlayer => p !== null);

  console.log(`Loaded ${playersCache.length} players from JSON`);
  return playersCache;
}

export function normalizePlayer(raw: RawPlayer): NormalizedPlayer | null {
  // List format: has Player array
  if (Array.isArray(raw.Player)) {
    const nat = raw['Nat.'];
    return {
      name: raw.Player[0] || '',
      position: raw.Player[1] || null,
      age: raw.Age || null,
      club: raw.Club || null,
      marketValue: raw['Market value'] || null,
      nationality: Array.isArray(nat) ? nat : nat ? [nat] : [],
      url: raw.givenUrl || null,
      playerId: null,
      leagueUrl: raw.givenUrl || null, // givenUrl is the competition URL
    };
  }

  // Profile format: has url with spieler
  if (raw.url && raw.type === 'player') {
    const playerIdMatch = raw.url.match(/spieler\/(\d+)/);
    const nameFromUrl = extractNameFromUrl(raw.url);
    const cit = raw.Citizenship;

    return {
      name: nameFromUrl,
      position: raw.Position || null,
      age: extractAge(raw['Date of birth/Age']),
      club: raw['Current club'] || null,
      marketValue: null,
      nationality: Array.isArray(cit) ? cit : cit ? [cit] : [],
      url: raw.url,
      playerId: playerIdMatch ? playerIdMatch[1] : null,
      leagueUrl: null,
    };
  }

  // Unknown format
  return null;
}

function extractNameFromUrl(url: string): string {
  // URL format: https://www.transfermarkt.com/coli-saco/profil/spieler/820633
  const match = url.match(/transfermarkt\.com\/([^/]+)\//);
  if (match) {
    return match[1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return 'Unknown';
}

function extractAge(value: string | undefined): string | null {
  if (!value) return null;
  // Format: "15/05/2002 (23)"
  const ageMatch = value.match(/\((\d+)\)/);
  return ageMatch ? ageMatch[1] : null;
}

/**
 * Parse market value string to numeric EUR value
 * Handles formats: "€500K" → 500000, "€1.5M" → 1500000, "€10M" → 10000000
 */
export function parseMarketValue(value: string | null): number | null {
  if (!value) return null;

  // Remove € symbol and whitespace
  const cleaned = value.replace(/[€\s]/g, '').toUpperCase();

  // Match number with optional decimal and K/M suffix
  const match = cleaned.match(/^([\d.]+)(K|M)?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  const suffix = match[2];
  if (suffix === 'K') return num * 1000;
  if (suffix === 'M') return num * 1000000;
  return num;
}

export function extractPlayerIdFromUrl(url: string): string | null {
  const match = url.match(/spieler\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Find a player by ID or name
 */
export function findPlayerById(id: string): NormalizedPlayer | null {
  const players = loadPlayers();

  // First try: playerId match
  const byId = players.find(p => p.playerId === id);
  if (byId) return byId;

  // Fallback: exact name match (URL-decoded)
  const decodedName = decodeURIComponent(id);
  const byName = players.find(p =>
    p.name.toLowerCase() === decodedName.toLowerCase()
  );

  return byName || null;
}

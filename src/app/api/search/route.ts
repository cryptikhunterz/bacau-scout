import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Raw player record from JSON (two possible formats)
interface RawPlayer {
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
interface Player {
  name: string;
  position: string | null;
  age: string | null;
  club: string | null;
  marketValue: string | null;
  nationality: string[];
  url: string | null;
  playerId: string | null;
}

// Cache the players in memory
let playersCache: Player[] | null = null;

function loadPlayers(): Player[] {
  if (playersCache) return playersCache;

  const jsonPath = path.join(process.cwd(), 'Bacau scout prototype ', 'JSON 2.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('JSON file not found:', jsonPath);
    return [];
  }

  const rawData: RawPlayer[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  playersCache = rawData
    .map(normalizePlayer)
    .filter((p): p is Player => p !== null);

  console.log(`Loaded ${playersCache.length} players from JSON`);
  return playersCache;
}

function normalizePlayer(raw: RawPlayer): Player | null {
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
function parseMarketValue(value: string | null): number | null {
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

function extractPlayerIdFromUrl(url: string): string | null {
  const match = url.match(/spieler\/(\d+)/);
  return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim() || '';

  // Parse filter parameters
  const positionFilter = searchParams.get('position')?.trim() || '';
  const clubFilter = searchParams.get('club')?.trim() || '';
  const minAgeParam = searchParams.get('minAge');
  const maxAgeParam = searchParams.get('maxAge');
  const minValueParam = searchParams.get('minValue');
  const maxValueParam = searchParams.get('maxValue');

  const minAge = minAgeParam ? parseInt(minAgeParam, 10) : null;
  const maxAge = maxAgeParam ? parseInt(maxAgeParam, 10) : null;
  const minValue = minValueParam ? parseInt(minValueParam, 10) : null;
  const maxValue = maxValueParam ? parseInt(maxValueParam, 10) : null;

  if (!query) {
    return NextResponse.json([]);
  }

  const players = loadPlayers();

  // Check if query is a Transfermarkt URL
  if (query.includes('transfermarkt.com') && query.includes('spieler')) {
    const searchPlayerId = extractPlayerIdFromUrl(query);

    if (searchPlayerId) {
      const matches = players.filter(p => p.playerId === searchPlayerId);
      return NextResponse.json(matches);
    }

    // URL but no player ID found - return empty
    return NextResponse.json([]);
  }

  // Text search: case-insensitive partial match on name
  const lowerQuery = query.toLowerCase();
  let matches = players.filter(p =>
    p.name.toLowerCase().includes(lowerQuery)
  );

  // Apply filters AFTER name search (filters are AND-ed together)

  // Position filter: exact match, case-insensitive
  if (positionFilter) {
    const lowerPosition = positionFilter.toLowerCase();
    matches = matches.filter(p =>
      p.position?.toLowerCase() === lowerPosition
    );
  }

  // Club filter: partial match, case-insensitive
  if (clubFilter) {
    const lowerClub = clubFilter.toLowerCase();
    matches = matches.filter(p =>
      p.club?.toLowerCase().includes(lowerClub)
    );
  }

  // Age filter: inclusive range
  if (minAge !== null && !isNaN(minAge)) {
    matches = matches.filter(p => {
      const playerAge = p.age ? parseInt(p.age, 10) : null;
      return playerAge !== null && playerAge >= minAge;
    });
  }

  if (maxAge !== null && !isNaN(maxAge)) {
    matches = matches.filter(p => {
      const playerAge = p.age ? parseInt(p.age, 10) : null;
      return playerAge !== null && playerAge <= maxAge;
    });
  }

  // Market value filter: inclusive range
  if (minValue !== null && !isNaN(minValue)) {
    matches = matches.filter(p => {
      const playerValue = parseMarketValue(p.marketValue);
      return playerValue !== null && playerValue >= minValue;
    });
  }

  if (maxValue !== null && !isNaN(maxValue)) {
    matches = matches.filter(p => {
      const playerValue = parseMarketValue(p.marketValue);
      return playerValue !== null && playerValue <= maxValue;
    });
  }

  return NextResponse.json(matches);
}

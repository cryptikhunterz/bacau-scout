import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

// Raw player record from JSON (new scraped format)
export interface RawPlayer {
  player_id?: string;
  name?: string;
  profile_url?: string;
  position?: string;
  age?: number | string;
  market_value?: string;
  nationality?: string | string[];
  club?: string;
  league?: string;
  league_code?: string;
  height?: string;
  foot?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  citizenship?: string;
  contract_expires?: string;
  shirt_number?: string;
  appearances?: number;
  goals?: number;
  assists?: number;
  minutes?: number;
  yellow_cards?: number;
  red_cards?: number;
  career_stats?: {
    total_appearances?: number;
    total_goals?: number;
    total_assists?: number;
  };
  career_totals?: {
    appearances?: number;
    goals?: number;
    assists?: number;
    minutes?: number;
    yellow_cards?: number;
  };
  season_stats?: Array<{
    season?: string;
    competition?: string;
    appearances?: number;
    goals?: number;
    assists?: number;
    minutes?: number;
  }>;
  photo_url?: string;

  // Legacy formats
  Player?: [string, string];
  Age?: string;
  Club?: string;
  'Market value'?: string;
  givenUrl?: string;
  'Nat.'?: string | string[];
  playerId?: string;
  leagueCode?: string;
  url?: string;
  type?: string;
}

// Normalized player for search results
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
  league: string | null;
  // Stats
  appearances: number | null;
  goals: number | null;
  assists: number | null;
  // Pre-computed fields for performance
  nameLower: string;
  nameSearch: string; // Stripped of diacritics for search
  marketValueNum: number | null;
  ageNum: number | null;
}

// Full player detail for profile page
export interface PlayerDetail {
  id: string;
  name: string;
  tmUrl: string | null;
  position: string | null;
  age: number | null;
  nationality: string | null;
  secondNationality: string | null;
  birthDate: string | null;
  birthplace: string | null;
  club: string | null;
  league: string | null;
  marketValue: string | null;
  height: string | null;
  foot: string | null;
  contractUntil: string | null;
  shirtNumber: string | null;
  photoUrl: string | null;
  careerTotals: {
    matches: number;
    goals: number;
    assists: number;
    minutes: number;
  } | null;
  stats: Array<{
    season: string;
    competition: string;
    matches: number;
    goals: number;
    assists: number;
  }>;
}

// Cache
let playersCache: NormalizedPlayer[] | null = null;
let rawPlayersCache: RawPlayer[] | null = null;
let playerIdMap: Map<string, NormalizedPlayer> = new Map();
let rawPlayerIdMap: Map<string, RawPlayer> = new Map();
let manualPlayersLoaded = false;

const prisma = new PrismaClient();

/**
 * Clear the players cache — call after adding a manual player
 */
export function clearPlayersCache(): void {
  playersCache = null;
  rawPlayersCache = null;
  playerIdMap = new Map();
  rawPlayerIdMap = new Map();
  manualPlayersLoaded = false;
}

/**
 * Strip diacritics/accents from string for search matching
 * e.g., "Târnovanu" -> "tarnovanu", "Müller" -> "muller"
 */
function stripDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function loadRawPlayers(): RawPlayer[] {
  if (rawPlayersCache) return rawPlayersCache;

  const jsonPath = path.join(process.cwd(), 'public', 'players.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('JSON file not found:', jsonPath);
    rawPlayersCache = [];
  } else {
    rawPlayersCache = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }
  
  // Build raw lookup map
  rawPlayerIdMap = new Map();
  for (const player of rawPlayersCache!) {
    const id = player.player_id || player.playerId;
    if (id) {
      rawPlayerIdMap.set(id, player);
    }
  }

  return rawPlayersCache!;
}

/**
 * Async version of loadPlayers that also merges manual players from DB.
 * Use this in API routes where async is available.
 */
export async function loadPlayersWithManual(): Promise<NormalizedPlayer[]> {
  // Start with the base JSON players
  const basePlayers = loadPlayers();

  if (manualPlayersLoaded) return basePlayers;

  try {
    const manualPlayers = await prisma.manualPlayer.findMany();

    if (manualPlayers.length === 0) {
      manualPlayersLoaded = true;
      return basePlayers;
    }

    console.log(`Loaded ${manualPlayers.length} manual players from DB`);

    for (const mp of manualPlayers) {
      // Skip if already in JSON data
      if (rawPlayerIdMap.has(mp.playerId)) continue;

      const raw: RawPlayer = {
        player_id: mp.playerId,
        name: mp.name,
        position: mp.position || undefined,
        age: mp.age || undefined,
        date_of_birth: mp.dateOfBirth || undefined,
        club: mp.club || undefined,
        league: mp.league || undefined,
        league_code: mp.leagueCode || undefined,
        market_value: mp.marketValue || undefined,
        nationality: mp.nationality || undefined,
        height: mp.height || undefined,
        foot: mp.foot || undefined,
        citizenship: mp.citizenship || undefined,
        contract_expires: mp.contractExpires || undefined,
        shirt_number: mp.shirtNumber || undefined,
        photo_url: mp.photoUrl || undefined,
        profile_url: mp.profileUrl || undefined,
        appearances: mp.appearances || undefined,
        goals: mp.goals || undefined,
        assists: mp.assists || undefined,
      };

      rawPlayersCache!.push(raw);
      rawPlayerIdMap.set(mp.playerId, raw);

      const normalized = normalizePlayer(raw);
      if (normalized) {
        playersCache!.push(normalized);
        if (normalized.playerId) {
          playerIdMap.set(normalized.playerId, normalized);
        }
      }
    }

    manualPlayersLoaded = true;
    return playersCache!;
  } catch (err) {
    console.error('Error loading manual players:', err);
    return basePlayers;
  }
}

/**
 * Async version of findPlayerById — checks DB manual players too
 */
export async function findPlayerByIdAsync(id: string): Promise<PlayerDetail | null> {
  // Try the JSON cache first (fast path)
  const fromJson = findPlayerById(id);
  if (fromJson) return fromJson;

  // Check manual players in DB
  try {
    const manual = await prisma.manualPlayer.findUnique({
      where: { playerId: id },
    });

    if (!manual) return null;

    return {
      id: manual.playerId,
      name: manual.name,
      tmUrl: manual.profileUrl,
      position: manual.position,
      age: manual.age,
      nationality: manual.nationality,
      secondNationality: null,
      birthDate: manual.dateOfBirth,
      birthplace: null,
      club: manual.club,
      league: manual.league,
      marketValue: manual.marketValue,
      height: manual.height,
      foot: manual.foot,
      contractUntil: manual.contractExpires,
      shirtNumber: manual.shirtNumber,
      photoUrl: manual.photoUrl,
      careerTotals: {
        matches: manual.appearances || 0,
        goals: manual.goals || 0,
        assists: manual.assists || 0,
        minutes: 0,
      },
      stats: [],
    };
  } catch (err) {
    console.error('Error looking up manual player:', err);
    return null;
  }
}

export function loadPlayers(): NormalizedPlayer[] {
  if (playersCache) return playersCache;

  const rawData = loadRawPlayers();

  playersCache = rawData
    .map(normalizePlayer)
    .filter((p): p is NormalizedPlayer => p !== null);

  // Build playerIdMap for O(1) lookups
  playerIdMap = new Map();
  for (const player of playersCache) {
    if (player.playerId) {
      playerIdMap.set(player.playerId, player);
    }
  }

  console.log(`Loaded ${playersCache.length} players from JSON`);
  return playersCache;
}

export function normalizePlayer(raw: RawPlayer): NormalizedPlayer | null {
  // New scraped format (has player_id or name at top level)
  if (raw.player_id || (raw.name && !raw.Player)) {
    const name = raw.name || 'Unknown';
    const age = raw.age?.toString() || null;
    const marketValue = raw.market_value || null;
    const playerId = raw.player_id || null;
    
    // Handle nationality - can be string or array
    let nationality: string[] = [];
    if (Array.isArray(raw.nationality)) {
      nationality = raw.nationality;
    } else if (raw.nationality) {
      nationality = [raw.nationality];
    }

    return {
      name,
      position: raw.position || null,
      age,
      club: raw.club || null,
      marketValue,
      nationality,
      url: raw.profile_url || null,
      playerId,
      leagueUrl: null,
      league: raw.league || null,
      appearances: raw.appearances || raw.career_stats?.total_appearances || null,
      goals: raw.goals || raw.career_stats?.total_goals || null,
      assists: raw.assists || raw.career_stats?.total_assists || null,
      nameLower: name.toLowerCase(),
      nameSearch: stripDiacritics(name),
      marketValueNum: parseMarketValue(marketValue),
      ageNum: age ? parseInt(age, 10) : null,
    };
  }

  // Legacy list format: has Player array
  if (Array.isArray(raw.Player)) {
    const nat = raw['Nat.'];
    const name = raw.Player[0] || '';
    const age = raw.Age || null;
    const marketValue = raw['Market value'] || null;
    const playerIdFromUrl = raw.givenUrl ? extractPlayerIdFromUrl(raw.givenUrl) : null;
    const playerId = raw.playerId || playerIdFromUrl;
    return {
      name,
      position: raw.Player[1] || null,
      age,
      club: raw.Club || null,
      marketValue,
      nationality: Array.isArray(nat) ? nat : nat ? [nat] : [],
      url: raw.givenUrl || null,
      playerId,
      leagueUrl: raw.givenUrl || null,
      league: raw.league || null,
      appearances: null,
      goals: null,
      assists: null,
      nameLower: name.toLowerCase(),
      nameSearch: stripDiacritics(name),
      marketValueNum: parseMarketValue(marketValue),
      ageNum: age ? parseInt(age, 10) : null,
    };
  }

  return null;
}

/**
 * Parse market value string to numeric EUR value
 */
export function parseMarketValue(value: string | null): number | null {
  if (!value) return null;

  const cleaned = value.replace(/[€\s]/g, '').toUpperCase();
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
 * Find a player by ID - returns full detail for profile page
 */
export function findPlayerById(id: string): PlayerDetail | null {
  // Ensure players are loaded
  loadRawPlayers();
  loadPlayers();

  // Get raw player data for full details
  const raw = rawPlayerIdMap.get(id);
  if (!raw) {
    // Try name lookup
    const players = loadPlayers();
    const decodedName = decodeURIComponent(id);
    const byName = players.find(p => p.nameLower === decodedName.toLowerCase());
    if (!byName || !byName.playerId) return null;
    
    const rawByName = rawPlayerIdMap.get(byName.playerId);
    if (!rawByName) return null;
    return rawToDetail(rawByName);
  }

  return rawToDetail(raw);
}

function rawToDetail(raw: RawPlayer): PlayerDetail {
  // Parse nationality
  let nationality: string | null = null;
  let secondNationality: string | null = null;
  
  if (Array.isArray(raw.nationality)) {
    nationality = raw.nationality[0] || null;
    secondNationality = raw.nationality[1] || null;
  } else if (raw.nationality) {
    nationality = raw.nationality;
  }

  // Get career totals
  const apps = raw.appearances || raw.career_stats?.total_appearances || raw.career_totals?.appearances || 0;
  const goals = raw.goals || raw.career_stats?.total_goals || raw.career_totals?.goals || 0;
  const assists = raw.assists || raw.career_stats?.total_assists || raw.career_totals?.assists || 0;
  const minutes = raw.minutes || raw.career_totals?.minutes || 0;

  // Parse season stats
  const stats = (raw.season_stats || [])
    .filter(s => s.appearances && s.appearances > 0)
    .map(s => ({
      season: s.season || '-',
      competition: s.competition || '-',
      matches: s.appearances || 0,
      goals: s.goals || 0,
      assists: s.assists || 0,
    }));

  // Parse age
  let age: number | null = null;
  if (typeof raw.age === 'number') {
    age = raw.age;
  } else if (raw.age) {
    age = parseInt(raw.age, 10) || null;
  }

  return {
    id: raw.player_id || raw.playerId || '',
    name: raw.name || 'Unknown',
    tmUrl: raw.profile_url || null,
    position: raw.position || null,
    age,
    nationality,
    secondNationality,
    birthDate: raw.date_of_birth || null,
    birthplace: raw.place_of_birth || null,
    club: raw.club || null,
    league: raw.league || null,
    marketValue: raw.market_value || null,
    height: raw.height || null,
    foot: raw.foot || null,
    contractUntil: raw.contract_expires || null,
    shirtNumber: raw.shirt_number || null,
    photoUrl: raw.photo_url || null,
    careerTotals: {
      matches: apps,
      goals: goals,
      assists: assists,
      minutes: minutes,
    },
    stats,
  };
}

/**
 * Get the total number of players loaded
 */
export function getPlayerCount(): number {
  loadPlayers();
  return playersCache?.length ?? 0;
}

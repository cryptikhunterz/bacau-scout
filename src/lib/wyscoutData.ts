import { WyscoutPlayer, WyscoutLeague, WyscoutPositionMetrics } from './wyscoutTypes';

let playersListCache: WyscoutPlayer[] | null = null;
let leaguesCache: WyscoutLeague[] | null = null;
let posMetricsCache: WyscoutPositionMetrics | null = null;
const chunkCache: Record<number, Record<number, WyscoutPlayer>> = {};

// Dashboard list (no metrics — small file)
export async function loadWyscoutPlayers(): Promise<WyscoutPlayer[]> {
  if (playersListCache) return playersListCache;
  const res = await fetch('/data/players-list.json');
  playersListCache = await res.json();
  return playersListCache!;
}

// Single player with full data (chunked loading)
export async function loadWyscoutPlayer(id: number): Promise<WyscoutPlayer | null> {
  const chunkId = Math.floor(id / 100);
  if (!chunkCache[chunkId]) {
    try {
      const res = await fetch(`/data/chunks/${chunkId}.json`);
      if (!res.ok) return null;
      chunkCache[chunkId] = await res.json();
    } catch {
      return null;
    }
  }
  return chunkCache[chunkId]?.[id] || null;
}

export async function loadWyscoutLeagues(): Promise<WyscoutLeague[]> {
  if (leaguesCache) return leaguesCache;
  const res = await fetch('/data/leagues.json');
  leaguesCache = await res.json();
  return leaguesCache!;
}

export async function loadWyscoutPositionMetrics(): Promise<WyscoutPositionMetrics> {
  if (posMetricsCache) return posMetricsCache;
  const res = await fetch('/data/position-metrics.json');
  posMetricsCache = await res.json();
  return posMetricsCache!;
}

export function getWyscoutPlayer(players: WyscoutPlayer[], id: number): WyscoutPlayer | undefined {
  return players.find(p => p.id === id);
}

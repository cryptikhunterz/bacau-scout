import { TeamListItem, WyscoutTeam, BacauReference } from './wyscoutTeamTypes';

let teamsListCache: TeamListItem[] | null = null;
let teamIndexCache: Record<string, number> | null = null;
let bacauCache: BacauReference | null = null;
const teamChunkCache: Record<number, Record<string, WyscoutTeam>> = {};

export async function loadTeamsList(): Promise<TeamListItem[]> {
  if (teamsListCache) return teamsListCache;
  const res = await fetch('/data/teams-list.json');
  teamsListCache = await res.json();
  return teamsListCache!;
}

async function loadTeamIndex(): Promise<Record<string, number>> {
  if (teamIndexCache) return teamIndexCache;
  const res = await fetch('/data/team-index.json');
  teamIndexCache = await res.json();
  return teamIndexCache!;
}

export async function loadTeam(id: string): Promise<WyscoutTeam | null> {
  const index = await loadTeamIndex();
  const chunkId = index[id];
  if (chunkId === undefined) return null;

  if (!teamChunkCache[chunkId]) {
    try {
      const res = await fetch(`/data/team-chunks/${chunkId}.json`);
      if (!res.ok) return null;
      teamChunkCache[chunkId] = await res.json();
    } catch {
      return null;
    }
  }

  return teamChunkCache[chunkId]?.[id] || null;
}

export async function loadBacauReference(): Promise<BacauReference | null> {
  if (bacauCache) return bacauCache;
  try {
    const res = await fetch('/data/bacau-reference.json');
    if (!res.ok) return null;
    bacauCache = await res.json();
    return bacauCache;
  } catch {
    return null;
  }
}

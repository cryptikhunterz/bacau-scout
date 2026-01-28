import { NextRequest, NextResponse } from 'next/server';
import {
  loadPlayers,
  parseMarketValue,
  extractPlayerIdFromUrl,
  NormalizedPlayer,
} from '@/lib/players';

// SearchPlayer type for API response (excludes leagueUrl for search results)
interface SearchPlayer {
  name: string;
  position: string | null;
  age: string | null;
  club: string | null;
  marketValue: string | null;
  nationality: string[];
  url: string | null;
  playerId: string | null;
}

function toSearchPlayer(player: NormalizedPlayer): SearchPlayer {
  return {
    name: player.name,
    position: player.position,
    age: player.age,
    club: player.club,
    marketValue: player.marketValue,
    nationality: player.nationality,
    url: player.url,
    playerId: player.playerId,
  };
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
      const matches = players
        .filter(p => p.playerId === searchPlayerId)
        .map(toSearchPlayer);
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

  return NextResponse.json(matches.map(toSearchPlayer));
}

import { NextRequest, NextResponse } from 'next/server';
import {
  loadPlayers,
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
  const startTime = performance.now();

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

  // Count active filters for logging
  let filterCount = 0;
  if (positionFilter) filterCount++;
  if (clubFilter) filterCount++;
  if (minAge !== null && !isNaN(minAge)) filterCount++;
  if (maxAge !== null && !isNaN(maxAge)) filterCount++;
  if (minValue !== null && !isNaN(minValue)) filterCount++;
  if (maxValue !== null && !isNaN(maxValue)) filterCount++;

  if (!query) {
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`[Search] query="" filters=${filterCount} results=0 time=${duration}ms`);
    return NextResponse.json([]);
  }

  const players = loadPlayers();

  // Check if query is a Transfermarkt URL (any domain: .com, .es, .de, .pt, .co.uk, etc.)
  if (query.includes('transfermarkt') && query.includes('spieler')) {
    const searchPlayerId = extractPlayerIdFromUrl(query);

    if (searchPlayerId) {
      const matches = players
        .filter(p => p.playerId === searchPlayerId)
        .map(toSearchPlayer);
      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`[Search] query="${query.substring(0, 50)}..." filters=${filterCount} results=${matches.length} time=${duration}ms`);
      return NextResponse.json(matches);
    }

    // URL but no player ID found - return empty
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`[Search] query="${query.substring(0, 50)}..." filters=${filterCount} results=0 time=${duration}ms`);
    return NextResponse.json([]);
  }

  // Text search: use pre-computed nameSearch (diacritics stripped) for performance
  const searchQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let matches = players.filter(p =>
    p.nameSearch.includes(searchQuery)
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

  // Age filter: use pre-computed ageNum for performance
  if (minAge !== null && !isNaN(minAge)) {
    matches = matches.filter(p =>
      p.ageNum !== null && p.ageNum >= minAge
    );
  }

  if (maxAge !== null && !isNaN(maxAge)) {
    matches = matches.filter(p =>
      p.ageNum !== null && p.ageNum <= maxAge
    );
  }

  // Market value filter: use pre-computed marketValueNum for performance
  if (minValue !== null && !isNaN(minValue)) {
    matches = matches.filter(p =>
      p.marketValueNum !== null && p.marketValueNum >= minValue
    );
  }

  if (maxValue !== null && !isNaN(maxValue)) {
    matches = matches.filter(p =>
      p.marketValueNum !== null && p.marketValueNum <= maxValue
    );
  }

  const results = matches.map(toSearchPlayer);
  const duration = (performance.now() - startTime).toFixed(2);
  console.log(`[Search] query="${query}" filters=${filterCount} results=${results.length} time=${duration}ms`);

  return NextResponse.json(results);
}

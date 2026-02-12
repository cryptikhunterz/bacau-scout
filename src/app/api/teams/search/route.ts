import { NextRequest, NextResponse } from 'next/server';
import { loadPlayers } from '@/lib/players';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() || '';

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const players = loadPlayers();
  const searchLower = q.toLowerCase();

  // Collect unique club names that match the query
  const clubSet = new Set<string>();
  for (const p of players) {
    if (p.club && p.club.toLowerCase().includes(searchLower)) {
      clubSet.add(p.club);
    }
  }

  // Sort alphabetically and limit to 20
  const clubs = Array.from(clubSet).sort().slice(0, 20);

  return NextResponse.json(clubs);
}

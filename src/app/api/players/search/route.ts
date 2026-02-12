import { NextRequest, NextResponse } from 'next/server';
import { loadPlayers } from '@/lib/players';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() || '';

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const players = loadPlayers();
  const searchQuery = q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const matches = players
    .filter((p) => p.nameSearch.includes(searchQuery))
    .slice(0, 20)
    .map((p) => ({
      playerId: p.playerId,
      name: p.name,
      position: p.position,
      club: p.club,
      age: p.age,
    }));

  return NextResponse.json(matches);
}

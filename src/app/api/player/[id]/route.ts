import { NextRequest, NextResponse } from 'next/server';
import { findPlayerById } from '@/lib/players';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = performance.now();
  const { id } = await params;

  if (!id) {
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`[Player] id="" found=false time=${duration}ms`);
    return NextResponse.json(
      { error: 'Player ID is required' },
      { status: 400 }
    );
  }

  const player = findPlayerById(id);
  const duration = (performance.now() - startTime).toFixed(2);
  console.log(`[Player] id="${id}" found=${!!player} time=${duration}ms`);

  if (!player) {
    return NextResponse.json(
      { error: 'Player not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(player);
}

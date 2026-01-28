import { NextRequest, NextResponse } from 'next/server';
import { findPlayerById } from '@/lib/players';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'Player ID is required' },
      { status: 400 }
    );
  }

  const player = findPlayerById(id);

  if (!player) {
    return NextResponse.json(
      { error: 'Player not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(player);
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache the parsed JSON in memory (read once per cold start)
let wyscoutData: Record<string, { metrics: Record<string, string>; position: string; wyscoutPosition: string }> | null = null;

function getWyscoutData() {
  if (wyscoutData) return wyscoutData;
  const filePath = path.join(process.cwd(), 'public', 'wyscout-metrics.json');
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  wyscoutData = JSON.parse(raw);
  return wyscoutData;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = getWyscoutData();

  if (!data) {
    return NextResponse.json({ error: 'Wyscout data not available' }, { status: 503 });
  }

  const player = data[id];
  if (!player) {
    return NextResponse.json({ error: 'Player not found in Wyscout data' }, { status: 404 });
  }

  return NextResponse.json(player);
}

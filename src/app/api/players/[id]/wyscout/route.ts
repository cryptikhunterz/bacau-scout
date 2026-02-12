import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── Percentile data (new) ──────────────────────────────────────────────────

interface RadarMetric {
  key: string;
  label: string;
  value: number;
  percentile: number;
  gp: number; // global percentile
}

interface PercentileData {
  pg: string;
  comp: string;
  radar: RadarMetric[];
  allround: RadarMetric[];
}

let percentileData: Record<string, PercentileData> | null = null;

function getPercentileData() {
  if (percentileData) return percentileData;
  const filePath = path.join(process.cwd(), 'public', 'wyscout-percentiles.json');
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  percentileData = JSON.parse(raw);
  return percentileData;
}

// ─── Legacy raw metrics data ────────────────────────────────────────────────

let wyscoutData: Record<string, { metrics: Record<string, string>; position: string; wyscoutPosition: string }> | null = null;

function getWyscoutData() {
  if (wyscoutData) return wyscoutData;
  const filePath = path.join(process.cwd(), 'public', 'wyscout-metrics.json');
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  wyscoutData = JSON.parse(raw);
  return wyscoutData;
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Try percentile data first
  const pctData = getPercentileData();
  if (pctData) {
    const player = pctData[id];
    if (player) {
      return NextResponse.json({
        ...player,
        hasPercentiles: true,
      });
    }
  }

  // Fall back to legacy raw metrics
  const data = getWyscoutData();
  if (!data) {
    return NextResponse.json({ error: 'Wyscout data not available' }, { status: 503 });
  }

  const player = data[id];
  if (!player) {
    return NextResponse.json({ error: 'Player not found in Wyscout data' }, { status: 404 });
  }

  return NextResponse.json({ ...player, hasPercentiles: false });
}

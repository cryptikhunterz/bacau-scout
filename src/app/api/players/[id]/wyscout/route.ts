import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { WS_KEY_TO_DISPLAY } from '@/lib/wyscoutRadar';

// ─── Percentile data (new) ──────────────────────────────────────────────────

interface RadarMetric {
  key: string;
  label: string;
  value: number;
  percentile: number;
  gp: number; // global percentile
}

interface TemplateData {
  radar: RadarMetric[];
  allround: RadarMetric[];
}

interface PercentileData {
  pg: string;
  comp: string;
  radar: RadarMetric[];
  allround: RadarMetric[];
  templates?: Record<string, TemplateData>;
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

// ─── Embedded Wyscout data from players.json ────────────────────────────────

interface RawPlayer {
  player_id?: string;
  position?: string;
  wyscout?: Record<string, string>;
  [key: string]: unknown;
}

let playersJsonCache: RawPlayer[] | null = null;
let playerIdLookup: Map<string, RawPlayer> | null = null;

function getPlayersJson(): Map<string, RawPlayer> {
  if (playerIdLookup) return playerIdLookup;
  const filePath = path.join(process.cwd(), 'public', 'players.json');
  if (!fs.existsSync(filePath)) {
    playerIdLookup = new Map();
    return playerIdLookup;
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  playersJsonCache = JSON.parse(raw);
  playerIdLookup = new Map();
  for (const p of playersJsonCache!) {
    if (p.player_id) {
      playerIdLookup.set(p.player_id, p);
    }
  }
  return playerIdLookup;
}

/**
 * Convert a player's embedded ws_ data to display-format metrics.
 */
function convertWsToDisplayMetrics(wsData: Record<string, string>): Record<string, string> {
  const metrics: Record<string, string> = {};
  for (const [wsKey, value] of Object.entries(wsData)) {
    const displayKey = WS_KEY_TO_DISPLAY[wsKey];
    if (displayKey && value !== undefined) {
      metrics[displayKey] = value;
    }
  }
  return metrics;
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

  // 1. Try percentile data first (best quality)
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

  // 2. Try embedded wyscout data from players.json
  const playersMap = getPlayersJson();
  const playerJson = playersMap.get(id);
  if (playerJson?.wyscout && Object.keys(playerJson.wyscout).length > 0) {
    const metrics = convertWsToDisplayMetrics(playerJson.wyscout);
    // Only return if there are meaningful metrics (not just position/age/etc)
    const hasStatMetrics = Object.entries(metrics).some(([key, val]) =>
      val !== '-' && val !== '' && !['Matches played', 'Minutes played'].includes(key)
    );
    if (hasStatMetrics) {
      const wsPosition = playerJson.wyscout.ws_position || '';
      return NextResponse.json({
        metrics,
        position: playerJson.position || '',
        wyscoutPosition: wsPosition,
        hasPercentiles: false,
      });
    }
  }

  // 3. Fall back to legacy raw metrics (wyscout-metrics.json)
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

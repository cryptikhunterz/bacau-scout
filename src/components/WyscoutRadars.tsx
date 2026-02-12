'use client';

import { useEffect, useState } from 'react';
import { RadarChart } from '@/components/RadarChart';
import { PercentileRadar } from '@/components/PercentileRadar';
import {
  getPositionMetrics,
  OVERALL_METRICS,
  extractRadarData,
} from '@/lib/wyscoutRadar';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RadarMetric {
  key: string;
  label: string;
  value: number;
  percentile: number;
  gp: number;
}

interface PercentileWyscoutData {
  hasPercentiles: true;
  pg: string;
  comp: string;
  radar: RadarMetric[];
  allround: RadarMetric[];
}

interface LegacyWyscoutData {
  hasPercentiles: false;
  metrics: Record<string, string>;
  position: string;
  wyscoutPosition: string;
}

type WyscoutData = PercentileWyscoutData | LegacyWyscoutData;

// ─── Position group labels ──────────────────────────────────────────────────

const PG_LABELS: Record<string, string> = {
  GK: 'GOALKEEPER',
  CB: 'CENTRE-BACK',
  WB: 'WING-BACK',
  DM: 'DEF. MIDFIELD',
  CM: 'CENTRAL MIDFIELD',
  AM: 'ATT. MIDFIELD',
  FW: 'FORWARD',
};

// ─── Component ──────────────────────────────────────────────────────────────

interface WyscoutRadarsProps {
  playerId: string;
  tmPosition?: string;
}

export function WyscoutRadars({ playerId, tmPosition }: WyscoutRadarsProps) {
  const [data, setData] = useState<WyscoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [compMode, setCompMode] = useState<'league' | 'global'>('league');

  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      return;
    }

    fetch(`/api/players/${playerId}/wyscout`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [playerId]);

  if (loading) {
    return (
      <div className="animate-pulse h-20 bg-zinc-900 rounded-xl border border-zinc-800" />
    );
  }

  if (!data) return null;

  // ─── Percentile mode ────────────────────────────────────────────────────

  if (data.hasPercentiles) {
    const { pg, comp, radar, allround } = data;

    // Pick percentile field based on comparison mode
    const getPercentile = (m: RadarMetric) =>
      compMode === 'league' ? (m.percentile ?? m.gp) : (m.gp ?? m.percentile);

    // Supplement sparse radars: ensure at least 3 meaningful data points each
    const MIN_RADAR_POINTS = 3;

    const supplementRadar = (primary: RadarMetric[], pool: RadarMetric[]): RadarMetric[] => {
      const meaningful = primary.filter(m => m.value !== 0 || (m.percentile !== undefined && m.percentile !== 50));
      if (meaningful.length >= MIN_RADAR_POINTS) return primary;

      const primaryKeys = new Set(primary.map(m => m.key));
      const candidates = pool
        .filter(m => !primaryKeys.has(m.key) && (m.value !== 0 || (m.percentile !== undefined && m.percentile !== 50)))
        .sort((a, b) => getPercentile(b) - getPercentile(a));

      const supplemented = [...primary];
      for (const candidate of candidates) {
        if (supplemented.filter(m => m.value !== 0 || (m.percentile !== undefined && m.percentile !== 50)).length >= MIN_RADAR_POINTS) break;
        supplemented.push(candidate);
      }
      return supplemented;
    };

    const effectiveRadar = supplementRadar(radar, allround);
    const effectiveAllround = supplementRadar(allround, radar);

    // Filter out metrics with no data (value=0 and percentile=50 means missing)
    const hasPositionData = effectiveRadar.length >= 3 && effectiveRadar.some((m) => m.value !== 0 || m.percentile !== 50);
    const hasAllroundData = effectiveAllround.length >= 3 && effectiveAllround.some((m) => m.value !== 0 || m.percentile !== 50);

    if (!hasPositionData && !hasAllroundData) return null;

    const posLabel = PG_LABELS[pg] || pg;

    return (
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-3 px-1">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-800/50 to-transparent" />
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em]">
            Advanced Metrics (Wyscout)
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-800/50 to-transparent" />
        </div>

        {/* Comparison toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCompMode('league')}
            className={`px-3 py-1 text-xs font-medium rounded-l-md border transition-colors ${
              compMode === 'league'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            🏆 League
          </button>
          <button
            onClick={() => setCompMode('global')}
            className={`px-3 py-1 text-xs font-medium rounded-r-md border transition-colors ${
              compMode === 'global'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            🌍 Global
          </button>
          <span className="ml-2 text-[10px] text-zinc-500 max-w-[180px] truncate" title={comp}>
            {compMode === 'league' ? comp : 'All leagues, same position'}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> ≥90th
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-300 inline-block" /> 65–89th
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block" /> 35–64th
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;35th
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Position Radar */}
          {hasPositionData && (
            <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <RadarChart
                labels={effectiveRadar.map((m) => m.label)}
                values={effectiveRadar.map((m) => getPercentile(m))}
                maxValue={100}
                mode="percentile"
                displayValues={effectiveRadar.map((m) => m.value)}
                percentiles={effectiveRadar.map((m) => getPercentile(m))}
                title={`${posLabel} PROFILE`}
              />
            </div>
          )}

          {/* Enrichment-style Percentile Radar */}
          {hasAllroundData && (
            <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <PercentileRadar
                labels={effectiveAllround.map((m) => m.label)}
                values={effectiveAllround.map((m) => getPercentile(m))}
                displayValues={effectiveAllround.map((m) => m.value)}
                percentiles={effectiveAllround.map((m) => getPercentile(m))}
                title="PERCENTILE PROFILE"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Legacy raw mode (fallback) ─────────────────────────────────────────

  const position = tmPosition || data.position || '';
  const posConfig = getPositionMetrics(position);
  const posData = posConfig.metrics.length >= 3
    ? extractRadarData(data.metrics, posConfig.metrics)
    : null;

  const overallData = extractRadarData(data.metrics, OVERALL_METRICS);

  const hasPositionData = posData && posData.values.some((v) => v > 0);
  const hasOverallData = overallData.values.some((v) => v > 0);

  if (!hasPositionData && !hasOverallData) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-800/50 to-transparent" />
        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em]">
          Advanced Metrics (Wyscout)
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-800/50 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hasPositionData && posData && (
          <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
            <RadarChart
              labels={posData.labels}
              values={posData.values}
              maxValue={1}
              maxValues={posData.maxValues}
              color="#22c55e"
              title={`${posConfig.groupLabel} PROFILE`}
            />
          </div>
        )}

        {hasOverallData && (
          <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
            <RadarChart
              labels={overallData.labels}
              values={overallData.values}
              maxValue={1}
              maxValues={overallData.maxValues}
              color="#3b82f6"
              title="ALL-ROUND PROFILE"
            />
          </div>
        )}
      </div>
    </div>
  );
}

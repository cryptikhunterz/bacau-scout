'use client';

import { useEffect, useState, useMemo } from 'react';
import { RadarChart } from '@/components/RadarChart';
import { PercentileRadar } from '@/components/PercentileRadar';

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

export function WyscoutRadars({ playerId }: WyscoutRadarsProps) {
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

  // Build dynamic radar data from API response
  const { positionRadar, allroundRadar } = useMemo(() => {
    if (!data || !data.hasPercentiles) {
      return { positionRadar: [] as RadarMetric[], allroundRadar: [] as RadarMetric[] };
    }

    const { radar, allround } = data;
    const allMetrics = [...radar, ...allround];

    // Position radar: use radar[] from API
    // If < 3 metrics, dynamically build from all available
    let posRadar = radar;
    if (posRadar.length < 3 && allMetrics.length >= 3) {
      const radarKeys = radar.map(m => m.key);
      posRadar = [...allMetrics]
        .sort((a, b) => {
          const aInPos = radarKeys.includes(a.key) ? 0 : 1;
          const bInPos = radarKeys.includes(b.key) ? 0 : 1;
          return aInPos - bInPos;
        })
        .slice(0, 16);
    }

    // Allround radar: use allround[] from API
    // If < 3, build from remaining metrics
    let allroundR = allround;
    if (allroundR.length < 3) {
      const posKeys = new Set(posRadar.map(m => m.key));
      const remaining = allMetrics.filter(m => !posKeys.has(m.key));
      if (remaining.length >= 3) {
        allroundR = remaining.slice(0, 16);
      }
    }

    return { positionRadar: posRadar, allroundRadar: allroundR };
  }, [data]);

  if (loading) {
    return (
      <div className="animate-pulse h-20 bg-zinc-900 rounded-xl border border-zinc-800" />
    );
  }

  if (!data) return null;

  // ─── Percentile mode ────────────────────────────────────────────────────

  if (data.hasPercentiles) {
    const { pg, comp } = data;

    const getPercentile = (m: RadarMetric) =>
      compMode === 'league' ? (m.percentile ?? m.gp) : (m.gp ?? m.percentile);

    const hasPositionData = positionRadar.length >= 3 && positionRadar.some((m) => m.value !== 0 || m.percentile !== 50);
    const hasAllroundData = allroundRadar.length >= 3 && allroundRadar.some((m) => m.value !== 0 || m.percentile !== 50);

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
                labels={positionRadar.map((m) => m.label)}
                values={positionRadar.map((m) => getPercentile(m))}
                maxValue={100}
                mode="percentile"
                displayValues={positionRadar.map((m) => m.value)}
                percentiles={positionRadar.map((m) => getPercentile(m))}
                title={`${posLabel} PROFILE`}
              />
            </div>
          )}

          {/* Percentile Radar */}
          {hasAllroundData && (
            <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <PercentileRadar
                labels={allroundRadar.map((m) => m.label)}
                values={allroundRadar.map((m) => getPercentile(m))}
                displayValues={allroundRadar.map((m) => m.value)}
                percentiles={allroundRadar.map((m) => getPercentile(m))}
                title="PERCENTILE PROFILE"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Legacy raw mode — no longer uses hardcoded templates ───────────────

  return null;
}

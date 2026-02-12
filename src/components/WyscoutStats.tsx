'use client';

import { useEffect, useState } from 'react';
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

type CompareMode = 'league' | 'global';

// ─── Percentile color utilities ─────────────────────────────────────────────

function percentileBarColor(pct: number): string {
  if (pct >= 81) return 'bg-emerald-500';
  if (pct >= 61) return 'bg-green-400';
  if (pct >= 41) return 'bg-yellow-500';
  if (pct >= 21) return 'bg-amber-500';
  return 'bg-red-600';
}

function percentileTextColor(pct: number): string {
  if (pct >= 81) return 'text-emerald-400';
  if (pct >= 61) return 'text-green-400';
  if (pct >= 41) return 'text-yellow-400';
  if (pct >= 21) return 'text-amber-400';
  return 'text-red-400';
}

// ─── Position group labels ──────────────────────────────────────────────────

const PG_LABELS: Record<string, string> = {
  GK: 'Goalkeeper',
  CB: 'Centre-Back',
  WB: 'Wing-Back',
  DM: 'Def. Midfield',
  CM: 'Central Midfield',
  AM: 'Att. Midfield',
  FW: 'Forward',
};

// ─── Metric Groups (from enrichment platform) ───────────────────────────────

const METRIC_GROUPS = [
  {
    title: '⚔️ Attack',
    keys: [
      'Goals per 90', 'xG per 90', 'Shots per 90', 'Shots on target, %',
      'Assists per 90', 'xA per 90', 'Key passes per 90', 'Crosses per 90',
      'Dribbles per 90', 'Successful dribbles, %',
      'Offensive duels per 90', 'Offensive duels won, %',
      'Touches in box per 90', 'Progressive runs per 90',
    ],
  },
  {
    title: '🛡️ Defence',
    keys: [
      'Defensive duels per 90', 'Defensive duels won, %',
      'Aerial duels per 90', 'Aerial duels won, %',
      'Interceptions per 90', 'Successful defensive actions per 90',
      'Sliding tackles per 90', 'Fouls per 90', 'Shots blocked per 90',
    ],
  },
  {
    title: '🔧 Passing',
    keys: [
      'Passes per 90', 'Accurate passes, %',
      'Long passes per 90', 'Accurate long passes, %',
      'Progressive passes per 90', 'Accurate progressive passes, %',
      'Forward passes per 90', 'Accurate forward passes, %',
      'Passes to final third per 90', 'Passes to penalty area per 90',
      'Deep completions per 90', 'Smart passes per 90',
    ],
  },
  {
    title: '🧤 Goalkeeping',
    keys: [
      'Save rate, %', 'Conceded goals per 90', 'Shots against per 90',
      'xG against per 90', 'Prevented goals per 90', 'Exits per 90',
    ],
  },
];

const INVERT_METRICS = new Set(['Fouls per 90', 'Conceded goals per 90', 'xG against per 90']);

// ─── Component ──────────────────────────────────────────────────────────────

interface WyscoutStatsProps {
  playerId: string;
}

export function WyscoutStats({ playerId }: WyscoutStatsProps) {
  const [data, setData] = useState<WyscoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState<CompareMode>('league');

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

  if (!data || !data.hasPercentiles) return null;

  const { pg, comp, radar, allround } = data;

  const getPercentile = (m: RadarMetric) =>
    compareMode === 'league' ? m.percentile : m.gp;

  const hasPositionData = radar.length >= 3 && radar.some((m) => m.value !== 0 || m.percentile !== 50);
  const hasAllroundData = allround.length >= 3 && allround.some((m) => m.value !== 0 || m.percentile !== 50);

  if (!hasPositionData && !hasAllroundData) return null;

  const posLabel = PG_LABELS[pg] || pg;
  const compareModeLabel = compareMode === 'league'
    ? `vs. same position in ${comp}`
    : `vs. same position across all leagues`;

  // Build metric lookup from radar + allround for the bar graphs
  const metricMap = new Map<string, RadarMetric>();
  for (const m of [...radar, ...allround]) {
    if (!metricMap.has(m.key)) metricMap.set(m.key, m);
  }

  // Build visible metric groups (only show groups with available data)
  const visibleGroups = METRIC_GROUPS.map(group => ({
    ...group,
    metrics: group.keys.filter(key => metricMap.has(key)),
  })).filter(group => group.metrics.length > 0);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-800/50 to-transparent" />
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-[0.15em]">
          📊 Wyscout Advanced Metrics
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-800/50 to-transparent" />
      </div>

      {/* Comparison Mode Toggle */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-sm text-zinc-400">Compare against:</span>
            <span className="text-xs text-zinc-600 ml-2">{compareModeLabel}</span>
          </div>
          <div className="flex bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setCompareMode('league')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                compareMode === 'league'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🏆 League
            </button>
            <button
              onClick={() => setCompareMode('global')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                compareMode === 'global'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🌍 Global
            </button>
          </div>
        </div>
      </div>

      {/* Radar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hasPositionData && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <RadarChart
              labels={radar.map((m) => m.label)}
              values={radar.map((m) => getPercentile(m))}
              maxValue={100}
              mode="percentile"
              displayValues={radar.map((m) => m.value)}
              percentiles={radar.map((m) => getPercentile(m))}
              title={`${posLabel.toUpperCase()} PROFILE`}
            />
          </div>
        )}

        {hasAllroundData && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <PercentileRadar
              labels={allround.map((m) => m.label)}
              values={allround.map((m) => getPercentile(m))}
              displayValues={allround.map((m) => m.value)}
              percentiles={allround.map((m) => getPercentile(m))}
              title="PERCENTILE PROFILE"
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> ≥81 Elite
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> 61-80 Good
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> 41-60 Average
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 21-40 Below
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> &lt;21 Poor
        </span>
      </div>

      {/* Detailed Metric Bars by Group */}
      {visibleGroups.map(group => (
        <div key={group.title} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="font-semibold text-white text-sm">{group.title}</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800/50 text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-3 py-1.5">Metric</th>
                <th className="text-right px-3 py-1.5 w-16">Value</th>
                <th className="text-right px-3 py-1.5 w-12">Pctl</th>
                <th className="px-3 py-1.5 w-36">Percentile</th>
              </tr>
            </thead>
            <tbody>
              {group.metrics.map(key => {
                const m = metricMap.get(key);
                if (!m) return null;
                const pct = getPercentile(m);
                const isInvert = INVERT_METRICS.has(key);
                return (
                  <tr key={key} className="border-b border-zinc-800/30 hover:bg-zinc-800/30">
                    <td className="px-3 py-1.5 text-zinc-300">
                      {key}
                      {isInvert && <span className="text-[10px] text-zinc-600 ml-1">(lower is better)</span>}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-white">
                      {m.value !== undefined ? m.value : '—'}
                    </td>
                    <td className={`px-3 py-1.5 text-right font-mono font-bold ${percentileTextColor(pct)}`}>
                      {pct}
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${percentileBarColor(pct)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

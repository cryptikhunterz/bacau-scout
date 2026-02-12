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

// ─── Metric Group categorization (for stat bar sections) ────────────────────
// These define which CATEGORY a metric belongs to for display purposes.
// The actual metrics shown are dynamic — only metrics present in the data appear.

const METRIC_CATEGORY_MAP: Record<string, string> = {
  // Attack
  'Goals per 90': '⚔️ Attack',
  'xG per 90': '⚔️ Attack',
  'Non-penalty goals per 90': '⚔️ Attack',
  'Head goals per 90': '⚔️ Attack',
  'Shots per 90': '⚔️ Attack',
  'Shots on target, %': '⚔️ Attack',
  'Assists per 90': '⚔️ Attack',
  'xA per 90': '⚔️ Attack',
  'Key passes per 90': '⚔️ Attack',
  'Crosses per 90': '⚔️ Attack',
  'Accurate crosses, %': '⚔️ Attack',
  'Dribbles per 90': '⚔️ Attack',
  'Successful dribbles, %': '⚔️ Attack',
  'Offensive duels per 90': '⚔️ Attack',
  'Offensive duels won, %': '⚔️ Attack',
  'Touches in box per 90': '⚔️ Attack',
  'Progressive runs per 90': '⚔️ Attack',
  'Received passes per 90': '⚔️ Attack',
  'Received long passes per 90': '⚔️ Attack',
  // Defence
  'Defensive duels per 90': '🛡️ Defence',
  'Defensive duels won, %': '🛡️ Defence',
  'Aerial duels per 90': '🛡️ Defence',
  'Aerial duels won, %': '🛡️ Defence',
  'Interceptions per 90': '🛡️ Defence',
  'Successful defensive actions per 90': '🛡️ Defence',
  'Sliding tackles per 90': '🛡️ Defence',
  'Fouls per 90': '🛡️ Defence',
  'Shots blocked per 90': '🛡️ Defence',
  'PAdj Sliding tackles': '🛡️ Defence',
  'PAdj Interceptions': '🛡️ Defence',
  // Passing
  'Passes per 90': '🔧 Passing',
  'Accurate passes, %': '🔧 Passing',
  'Long passes per 90': '🔧 Passing',
  'Accurate long passes, %': '🔧 Passing',
  'Progressive passes per 90': '🔧 Passing',
  'Accurate progressive passes, %': '🔧 Passing',
  'Forward passes per 90': '🔧 Passing',
  'Accurate forward passes, %': '🔧 Passing',
  'Passes to final third per 90': '🔧 Passing',
  'Passes to penalty area per 90': '🔧 Passing',
  'Deep completions per 90': '🔧 Passing',
  'Smart passes per 90': '🔧 Passing',
  'Accurate smart passes, %': '🔧 Passing',
  'Through passes per 90': '🔧 Passing',
  'Accurate through passes, %': '🔧 Passing',
  'Lateral passes per 90': '🔧 Passing',
  'Accurate lateral passes, %': '🔧 Passing',
  'Back passes per 90': '🔧 Passing',
  'Accurate back passes, %': '🔧 Passing',
  'Second assists per 90': '🔧 Passing',
  'Third assists per 90': '🔧 Passing',
  // Goalkeeping
  'Save rate, %': '🧤 Goalkeeping',
  'Conceded goals per 90': '🧤 Goalkeeping',
  'Shots against per 90': '🧤 Goalkeeping',
  'xG against per 90': '🧤 Goalkeeping',
  'Prevented goals per 90': '🧤 Goalkeeping',
  'Exits per 90': '🧤 Goalkeeping',
  'Clean sheets, %': '🧤 Goalkeeping',
};

const INVERT_METRICS = new Set(['Fouls per 90', 'Conceded goals per 90', 'xG against per 90']);

// ─── Dynamic radar builder (like enrichment platform) ───────────────────────

function buildDynamicRadar(
  allMetrics: RadarMetric[],
  positionKeys: string[],
  maxAxes: number = 16,
): RadarMetric[] {
  // Sort: position-specific keys first, then rest
  const sorted = [...allMetrics].sort((a, b) => {
    const aInPos = positionKeys.includes(a.key) ? 0 : 1;
    const bInPos = positionKeys.includes(b.key) ? 0 : 1;
    return aInPos - bInPos;
  });
  return sorted.slice(0, maxAxes);
}

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

  // Build dynamic radar data
  const { positionRadarMetrics, allroundRadarMetrics, allMetricsList } = useMemo(() => {
    if (!data || !data.hasPercentiles) {
      return { positionRadarMetrics: [], allroundRadarMetrics: [], allMetricsList: [] };
    }

    const { radar, allround } = data;
    const allMetrics = [...radar, ...allround];

    // Position radar: use radar[] from API data
    // If radar has fewer than 3 metrics, dynamically build from ALL available
    let posRadar = radar;
    if (posRadar.length < 3) {
      const radarKeys = radar.map(m => m.key);
      posRadar = buildDynamicRadar(allMetrics, radarKeys, 16);
    }

    // Allround radar: use allround[] from API data
    // If allround has fewer than 3 metrics, dynamically build from remaining
    let allroundRadar = allround;
    if (allroundRadar.length < 3) {
      const posKeys = new Set(posRadar.map(m => m.key));
      const remaining = allMetrics.filter(m => !posKeys.has(m.key));
      if (remaining.length >= 3) {
        allroundRadar = remaining.slice(0, 16);
      }
    }

    return {
      positionRadarMetrics: posRadar,
      allroundRadarMetrics: allroundRadar,
      allMetricsList: allMetrics,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="animate-pulse h-20 bg-zinc-900 rounded-xl border border-zinc-800" />
    );
  }

  if (!data || !data.hasPercentiles) return null;

  const { pg, comp } = data;

  const getPercentile = (m: RadarMetric) =>
    compareMode === 'league' ? (m.percentile ?? m.gp) : (m.gp ?? m.percentile);

  const hasPositionData = positionRadarMetrics.length >= 3 && 
    positionRadarMetrics.some((m) => m.value !== 0 || m.percentile !== 50);
  const hasAllroundData = allroundRadarMetrics.length >= 3 && 
    allroundRadarMetrics.some((m) => m.value !== 0 || m.percentile !== 50);

  if (!hasPositionData && !hasAllroundData) return null;

  const posLabel = PG_LABELS[pg] || pg;
  const compareModeLabel = compareMode === 'league'
    ? `vs. same position in ${comp}`
    : `vs. same position across all leagues`;

  // Build metric lookup from ALL metrics for the bar graphs (dynamic, not hardcoded)
  const metricMap = new Map<string, RadarMetric>();
  for (const m of allMetricsList) {
    if (!metricMap.has(m.key)) metricMap.set(m.key, m);
  }

  // Build visible metric groups dynamically from ALL available metrics
  const groupedMetrics = new Map<string, { key: string; metric: RadarMetric }[]>();
  for (const [key, metric] of metricMap.entries()) {
    const category = METRIC_CATEGORY_MAP[key] || '📋 Other';
    if (!groupedMetrics.has(category)) {
      groupedMetrics.set(category, []);
    }
    groupedMetrics.get(category)!.push({ key, metric });
  }

  // Convert to array, filter empty groups
  const visibleGroups = Array.from(groupedMetrics.entries())
    .filter(([, metrics]) => metrics.length > 0)
    .map(([title, metrics]) => ({ title, metrics }));

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
              labels={positionRadarMetrics.map((m) => m.label)}
              values={positionRadarMetrics.map((m) => getPercentile(m))}
              maxValue={100}
              mode="percentile"
              displayValues={positionRadarMetrics.map((m) => m.value)}
              percentiles={positionRadarMetrics.map((m) => getPercentile(m))}
              title={`${posLabel.toUpperCase()} PROFILE`}
            />
          </div>
        )}

        {hasAllroundData && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <PercentileRadar
              labels={allroundRadarMetrics.map((m) => m.label)}
              values={allroundRadarMetrics.map((m) => getPercentile(m))}
              displayValues={allroundRadarMetrics.map((m) => m.value)}
              percentiles={allroundRadarMetrics.map((m) => getPercentile(m))}
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

      {/* Detailed Metric Bars by Group — DYNAMIC from actual data */}
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
              {group.metrics.map(({ key, metric: m }) => {
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

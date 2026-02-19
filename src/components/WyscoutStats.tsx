'use client';

import { useEffect, useState } from 'react';
// Radar charts are rendered by WyscoutRadars — this component only shows stat bars

// ─── Types ──────────────────────────────────────────────────────────────────

interface RadarMetric {
  key: string;
  label: string;
  value: number;
  percentile: number;
  gp: number;
}

interface TemplateData {
  radar: RadarMetric[];
  allround: RadarMetric[];
}

interface PercentileWyscoutData {
  hasPercentiles: true;
  pg: string;
  comp: string;
  radar: RadarMetric[];
  allround: RadarMetric[];
  templates?: Record<string, TemplateData>;
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
  FB: 'Fullback',
  DM: 'Def. Midfield',
  CM: 'Central Midfield',
  AM: 'Att. Midfield',
  FW: 'Forward',
  W: 'Winger',
  CF: 'Centre-Forward',
};

// ─── Metric Groups (comprehensive, covers all position-specific + general) ──

const METRIC_GROUPS = [
  {
    title: '⚔️ Attack',
    keys: [
      'Goals per 90', 'xG per 90', 'Non-penalty goals per 90',
      'Head goals per 90', 'Shots per 90', 'Shots on target, %',
      'Goal conversion, %', 'Assists per 90', 'xA per 90',
      'Second assists per 90', 'Third assists per 90',
      'Key passes per 90', 'Crosses per 90', 'Accurate crosses, %',
      'Dribbles per 90', 'Successful dribbles, %',
      'Offensive duels per 90', 'Offensive duels won, %',
      'Touches in box per 90', 'Progressive runs per 90',
      'Successful attacking actions per 90',
    ],
  },
  {
    title: '🛡️ Defence',
    keys: [
      'Defensive duels per 90', 'Defensive duels won, %',
      'Duels per 90', 'Duels won, %',
      'Aerial duels per 90', 'Aerial duels won, %',
      'Interceptions per 90', 'PAdj Interceptions',
      'Successful defensive actions per 90',
      'Sliding tackles per 90', 'PAdj Sliding tackles',
      'Fouls per 90', 'Shots blocked per 90',
      'Yellow cards per 90', 'Red cards per 90',
    ],
  },
  {
    title: '🔧 Passing',
    keys: [
      'Passes per 90', 'Accurate passes, %',
      'Long passes per 90', 'Accurate long passes, %',
      'Average long pass length, m',
      'Progressive passes per 90', 'Accurate progressive passes, %',
      'Forward passes per 90', 'Accurate forward passes, %',
      'Back passes per 90', 'Accurate back passes, %',
      'Lateral passes per 90', 'Accurate lateral passes, %',
      'Short / medium passes per 90', 'Accurate short / medium passes, %',
      'Average pass length, m',
      'Passes to final third per 90', 'Accurate passes to final third, %',
      'Passes to penalty area per 90', 'Accurate passes to penalty area, %',
      'Through passes per 90', 'Accurate through passes, %',
      'Smart passes per 90', 'Accurate smart passes, %',
      'Deep completions per 90', 'Deep completed crosses per 90',
      'Corners per 90', 'Free kicks per 90',
      'Direct free kicks per 90', 'Direct free kicks on target, %',
    ],
  },
  {
    title: '🧤 Goalkeeping',
    keys: [
      'Save rate, %', 'Conceded goals per 90', 'Shots against per 90',
      'xG against per 90', 'Prevented goals per 90', 'Exits per 90',
      'Clean sheets', 'Conceded goals', 'Shots against',
      'xG against', 'Prevented goals',
    ],
  },
];

const INVERT_METRICS = new Set(['Fouls per 90', 'Conceded goals per 90', 'xG against per 90', 'Yellow cards per 90', 'Red cards per 90']);

// ─── Max values for raw (non-percentile) bar scaling ────────────────────────

const RAW_MAX_VALUES: Record<string, number> = {
  'Goals per 90': 1.0,
  'xG per 90': 0.6,
  'Non-penalty goals per 90': 0.8,
  'Head goals per 90': 0.3,
  'Shots per 90': 6,
  'Shots on target, %': 100,
  'Goal conversion, %': 100,
  'Assists per 90': 0.5,
  'xA per 90': 0.4,
  'Second assists per 90': 0.3,
  'Third assists per 90': 0.2,
  'Key passes per 90': 4,
  'Crosses per 90': 10,
  'Accurate crosses, %': 100,
  'Dribbles per 90': 10,
  'Successful dribbles, %': 100,
  'Offensive duels per 90': 15,
  'Offensive duels won, %': 100,
  'Touches in box per 90': 8,
  'Progressive runs per 90': 8,
  'Successful attacking actions per 90': 5,
  'Defensive duels per 90': 12,
  'Defensive duels won, %': 100,
  'Duels per 90': 20,
  'Duels won, %': 100,
  'Aerial duels per 90': 10,
  'Aerial duels won, %': 100,
  'Interceptions per 90': 10,
  'PAdj Interceptions': 12,
  'Successful defensive actions per 90': 10,
  'Sliding tackles per 90': 3,
  'PAdj Sliding tackles': 4,
  'Fouls per 90': 4,
  'Shots blocked per 90': 3,
  'Yellow cards per 90': 1,
  'Red cards per 90': 0.3,
  'Passes per 90': 65,
  'Accurate passes, %': 100,
  'Long passes per 90': 12,
  'Accurate long passes, %': 100,
  'Average long pass length, m': 50,
  'Progressive passes per 90': 12,
  'Accurate progressive passes, %': 100,
  'Forward passes per 90': 30,
  'Accurate forward passes, %': 100,
  'Back passes per 90': 15,
  'Accurate back passes, %': 100,
  'Lateral passes per 90': 20,
  'Accurate lateral passes, %': 100,
  'Short / medium passes per 90': 50,
  'Accurate short / medium passes, %': 100,
  'Average pass length, m': 30,
  'Passes to final third per 90': 12,
  'Accurate passes to final third, %': 100,
  'Passes to penalty area per 90': 4,
  'Accurate passes to penalty area, %': 100,
  'Through passes per 90': 2,
  'Accurate through passes, %': 100,
  'Smart passes per 90': 4,
  'Accurate smart passes, %': 100,
  'Deep completions per 90': 4,
  'Deep completed crosses per 90': 2,
  'Corners per 90': 4,
  'Free kicks per 90': 3,
  'Direct free kicks per 90': 1,
  'Direct free kicks on target, %': 100,
  'Save rate, %': 100,
  'Conceded goals per 90': 3,
  'Shots against per 90': 8,
  'xG against per 90': 2,
  'Prevented goals per 90': 1,
  'Exits per 90': 3,
  'Clean sheets': 20,
  'Conceded goals': 50,
  'Shots against': 100,
  'xG against': 50,
  'Prevented goals': 10,
};

// ─── Component ──────────────────────────────────────────────────────────────

interface WyscoutStatsProps {
  playerId: string;
}

export function WyscoutStats({ playerId }: WyscoutStatsProps) {
  const [data, setData] = useState<WyscoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState<CompareMode>('league');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

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

  // ─── Percentile mode ──────────────────────────────────────────────────

  if (data.hasPercentiles) {
    // Resolve effective radar/allround based on selected template
    const activePg = selectedTemplate || data.pg;
    let effectiveRadar = data.radar;
    let effectiveAllround = data.allround;

    if (selectedTemplate && data.templates && data.templates[selectedTemplate]) {
      effectiveRadar = data.templates[selectedTemplate].radar;
      effectiveAllround = data.templates[selectedTemplate].allround;
    }

    const { radar, allround } = { radar: effectiveRadar, allround: effectiveAllround };

    const getPercentile = (m: RadarMetric) =>
      compareMode === 'league' ? (m.percentile ?? m.gp) : (m.gp ?? m.percentile);

    // Build metric lookup from radar + allround for the bar graphs
    const metricMap = new Map<string, RadarMetric>();
    for (const m of [...radar, ...allround]) {
      if (!metricMap.has(m.key)) metricMap.set(m.key, m);
    }

    if (metricMap.size === 0) return null;

    // Build visible metric groups
    const categorizedKeys = new Set(METRIC_GROUPS.flatMap(g => g.keys));
    const uncategorizedKeys = Array.from(metricMap.keys()).filter(k => !categorizedKeys.has(k));

    const visibleGroups = [
      ...METRIC_GROUPS.map(group => ({
        ...group,
        metrics: group.keys,
        hasAny: group.keys.some(key => metricMap.has(key)),
      })),
      ...(uncategorizedKeys.length > 0
        ? [{
            title: '📋 Other',
            keys: uncategorizedKeys,
            metrics: uncategorizedKeys,
            hasAny: true,
          }]
        : []),
    ].filter(group => group.hasAny);

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

        {/* Position Template Selector */}
        {data.templates && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Position Template:</span>
              <select
                value={activePg}
                onChange={(e) => setSelectedTemplate(e.target.value === data.pg ? '' : e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {Object.keys(data.templates!).map((g) => (
                  <option key={g} value={g}>
                    {g} — {PG_LABELS[g] || g}
                    {g === data.pg ? ' (natural)' : ''}
                  </option>
                ))}
              </select>
              {selectedTemplate && selectedTemplate !== data.pg && (
                <button
                  onClick={() => setSelectedTemplate('')}
                  className="text-xs text-zinc-500 hover:text-white underline"
                >
                  Reset to {data.pg}
                </button>
              )}
            </div>
          </div>
        )}

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
                  const pct = m ? getPercentile(m) : null;
                  const isInvert = INVERT_METRICS.has(key);
                  return (
                    <tr key={key} className={`border-b border-zinc-800/30 hover:bg-zinc-800/30 ${!m ? 'opacity-40' : ''}`}>
                      <td className="px-3 py-1.5 text-zinc-300">
                        {key}
                        {isInvert && <span className="text-[10px] text-zinc-600 ml-1">(lower is better)</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-white">
                        {m && m.value !== undefined ? m.value : '—'}
                      </td>
                      <td className={`px-3 py-1.5 text-right font-mono font-bold ${pct !== null ? percentileTextColor(pct) : 'text-zinc-600'}`}>
                        {pct !== null ? pct : '—'}
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            {pct !== null && (
                              <div
                                className={`h-full rounded-full ${percentileBarColor(pct)}`}
                                style={{ width: `${pct}%` }}
                              />
                            )}
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

  // ─── Legacy (non-percentile) mode ─────────────────────────────────────

  const { metrics, position } = data;

  // Build metric lookup for bar display
  const legacyMetricMap = new Map<string, { key: string; value: string; numValue: number }>();
  for (const [key, val] of Object.entries(metrics)) {
    if (val && val !== '-' && val !== '') {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        legacyMetricMap.set(key, { key, value: val, numValue: num });
      }
    }
  }

  if (legacyMetricMap.size === 0) return null;

  // Build visible metric groups for legacy data
  const categorizedKeys = new Set(METRIC_GROUPS.flatMap(g => g.keys));
  const uncategorizedKeys = Array.from(legacyMetricMap.keys()).filter(k => !categorizedKeys.has(k));

  const visibleGroups = [
    ...METRIC_GROUPS.map(group => ({
      ...group,
      metrics: group.keys,
      hasAny: group.keys.some(key => legacyMetricMap.has(key)),
    })),
    ...(uncategorizedKeys.length > 0
      ? [{
          title: '📋 Other',
          keys: uncategorizedKeys,
          metrics: uncategorizedKeys,
          hasAny: true,
        }]
      : []),
  ].filter(group => group.hasAny);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-800/50 to-transparent" />
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-[0.15em]">
          📊 Wyscout Stats
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-800/50 to-transparent" />
      </div>

      {/* Detailed Metric Bars by Group — raw values */}
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
                <th className="px-3 py-1.5 w-36">Bar</th>
              </tr>
            </thead>
            <tbody>
              {group.metrics.map(key => {
                const m = legacyMetricMap.get(key);
                const isInvert = INVERT_METRICS.has(key);
                const maxVal = RAW_MAX_VALUES[key] || 100;
                const barWidth = m ? Math.min((m.numValue / maxVal) * 100, 100) : 0;

                return (
                  <tr key={key} className={`border-b border-zinc-800/30 hover:bg-zinc-800/30 ${!m ? 'opacity-40' : ''}`}>
                    <td className="px-3 py-1.5 text-zinc-300">
                      {key}
                      {isInvert && <span className="text-[10px] text-zinc-600 ml-1">(lower is better)</span>}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-white">
                      {m ? m.value : '—'}
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          {m && (
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${Math.max(barWidth, 0.5)}%` }}
                            />
                          )}
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

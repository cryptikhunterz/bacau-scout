'use client';

import { useEffect, useState } from 'react';
import { RadarChart } from '@/components/RadarChart';

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

type CompareMode = 'league' | 'global';

// ─── Percentile color utilities ─────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────

interface WyscoutCompareProps {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
}

export function WyscoutCompare({ player1Id, player2Id, player1Name, player2Name }: WyscoutCompareProps) {
  const [data1, setData1] = useState<PercentileWyscoutData | null>(null);
  const [data2, setData2] = useState<PercentileWyscoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState<CompareMode>('league');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/players/${player1Id}/wyscout`).then(r => r.ok ? r.json() : null),
      fetch(`/api/players/${player2Id}/wyscout`).then(r => r.ok ? r.json() : null),
    ]).then(([d1, d2]) => {
      if (d1?.hasPercentiles) setData1(d1);
      if (d2?.hasPercentiles) setData2(d2);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [player1Id, player2Id]);

  if (loading) {
    return (
      <div className="animate-pulse h-20 bg-zinc-900 rounded-xl border border-zinc-800" />
    );
  }

  if (!data1 && !data2) return null;

  const getPercentile = (m: RadarMetric) =>
    compareMode === 'league' ? m.percentile : m.gp;

  // Use player 1's position for template, fallback to player 2
  const primaryData = data1 || data2;
  const activePg = selectedTemplate || primaryData?.pg || '';
  const posLabel = PG_LABELS[activePg] || activePg;

  // Resolve effective radar/allround based on selected template
  const resolveData = (d: PercentileWyscoutData): { radar: RadarMetric[]; allround: RadarMetric[] } => {
    if (selectedTemplate && d.templates && d.templates[selectedTemplate]) {
      return d.templates[selectedTemplate];
    }
    return { radar: d.radar, allround: d.allround };
  };

  const effective1 = data1 ? resolveData(data1) : null;
  const effective2 = data2 ? resolveData(data2) : null;

  // Supplement sparse radars: ensure at least 3 meaningful data points each
  const supplementRadar = (primary: RadarMetric[], pool: RadarMetric[]): RadarMetric[] => {
    const MIN_RADAR_POINTS = 3;
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

  // Build comparison radar: use UNION of metrics from both players (not just shared)
  const buildOverlayRadar = (metrics1: RadarMetric[], metrics2: RadarMetric[]) => {
    // Supplement each side individually first
    const allPool1 = effective1 ? [...effective1.radar, ...effective1.allround] : [];
    const allPool2 = effective2 ? [...effective2.radar, ...effective2.allround] : [];
    const sup1 = supplementRadar(metrics1, allPool1.filter(m => !metrics1.some(r => r.key === m.key)));
    const sup2 = supplementRadar(metrics2, allPool2.filter(m => !metrics2.some(r => r.key === m.key)));

    // Use union of keys from both supplemented lists
    const keyMap1 = new Map(sup1.map(m => [m.key, m]));
    const keyMap2 = new Map(sup2.map(m => [m.key, m]));
    const allKeys = new Set([...sup1.map(m => m.key), ...sup2.map(m => m.key)]);
    const unionKeys = Array.from(allKeys);
    if (unionKeys.length < 3) return null;

    const labels = unionKeys.map(k => {
      const m = keyMap1.get(k) || keyMap2.get(k);
      return m?.label || k;
    });
    const values1 = unionKeys.map(k => {
      const m = keyMap1.get(k);
      return m ? getPercentile(m) : 0;
    });
    const values2 = unionKeys.map(k => {
      const m = keyMap2.get(k);
      return m ? getPercentile(m) : 0;
    });
    const displayValues1 = unionKeys.map(k => {
      const m = keyMap1.get(k);
      return m ? m.value : 0;
    });
    const displayValues2 = unionKeys.map(k => {
      const m = keyMap2.get(k);
      return m ? m.value : 0;
    });

    return { labels, values1, values2, displayValues1, displayValues2 };
  };

  // Position radar comparison
  const posRadar = effective1 && effective2
    ? buildOverlayRadar(effective1.radar, effective2.radar)
    : null;

  // All-round radar comparison
  const allRadar = effective1 && effective2
    ? buildOverlayRadar(effective1.allround, effective2.allround)
    : null;

  // Build all metric keys for bar comparison
  const allMetrics = new Map<string, { m1: RadarMetric | null; m2: RadarMetric | null }>();
  if (effective1) {
    for (const m of [...effective1.radar, ...effective1.allround]) {
      if (!allMetrics.has(m.key)) allMetrics.set(m.key, { m1: m, m2: null });
    }
  }
  if (effective2) {
    for (const m of [...effective2.radar, ...effective2.allround]) {
      const existing = allMetrics.get(m.key);
      if (existing) {
        existing.m2 = m;
      } else {
        allMetrics.set(m.key, { m1: null, m2: m });
      }
    }
  }

  const compareModeLabel = compareMode === 'league'
    ? 'League percentiles'
    : 'Global percentiles';

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

      {/* Toggle + Template Selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-zinc-400">{compareModeLabel}</span>
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

        {/* Position Template Selector */}
        {primaryData?.templates && (
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">Template:</span>
            <select
              value={activePg}
              onChange={(e) => setSelectedTemplate(e.target.value === primaryData?.pg ? '' : e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {Object.keys(primaryData!.templates!).map((g) => (
                <option key={g} value={g}>
                  {g} — {PG_LABELS[g] || g}
                  {g === primaryData?.pg ? ' (natural)' : ''}
                </option>
              ))}
            </select>
            {selectedTemplate && selectedTemplate !== primaryData?.pg && (
              <button
                onClick={() => setSelectedTemplate('')}
                className="text-xs text-zinc-500 hover:text-white underline"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Radar Charts */}
      {data1 && data2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {posRadar && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                {posLabel} Profile
              </h3>
              <p className="text-[10px] text-zinc-600 mb-3">Percentile values · Overlay comparison</p>
              <RadarChart
                labels={posRadar.labels}
                values={posRadar.values1}
                maxValue={100}
                mode="percentile"
                displayValues={posRadar.displayValues1}
                percentiles={posRadar.values1}
                comparisonValues={posRadar.values2}
                comparisonColor="#ef4444"
              />
              <div className="flex justify-center gap-6 mt-2 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> {player1Name}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-red-500 inline-block rounded" style={{ borderTop: '1px dashed' }} /> {player2Name}
                </span>
              </div>
            </div>
          )}

          {allRadar && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                All-Round Profile
              </h3>
              <p className="text-[10px] text-zinc-600 mb-3">Percentile values · Overlay comparison</p>
              <RadarChart
                labels={allRadar.labels}
                values={allRadar.values1}
                maxValue={100}
                mode="percentile"
                displayValues={allRadar.displayValues1}
                percentiles={allRadar.values1}
                comparisonValues={allRadar.values2}
                comparisonColor="#ef4444"
              />
              <div className="flex justify-center gap-6 mt-2 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> {player1Name}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-red-500 inline-block rounded" style={{ borderTop: '1px dashed' }} /> {player2Name}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bar Graph Comparison */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-1">📊 Wyscout Stat Comparison</h3>
        <p className="text-xs text-zinc-500 mb-4">Side-by-side bar graphs for each metric</p>
        <div className="space-y-3">
          {Array.from(allMetrics.entries()).map(([key, { m1, m2 }]) => {
            const val1 = m1?.value;
            const val2 = m2?.value;
            if (val1 === undefined && val2 === undefined) return null;
            const maxVal = Math.max(val1 ?? 0, val2 ?? 0, 0.01);

            const pct1 = m1 ? getPercentile(m1) : null;
            const pct2 = m2 ? getPercentile(m2) : null;

            return (
              <div key={key} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                    {m1?.label || m2?.label || key}
                  </span>
                </div>
                <div className="space-y-1">
                  {/* Player 1 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium w-16 truncate text-blue-400">
                      {player1Name}
                    </span>
                    <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
                      <div
                        className="h-full rounded bg-blue-500 transition-all"
                        style={{ width: `${val1 !== undefined ? Math.max((val1 / maxVal) * 100, 0.5) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white w-12 text-right">
                      {val1 !== undefined ? val1 : '—'}
                    </span>
                    {pct1 !== null && (
                      <span className={`text-[10px] font-mono w-8 text-right ${percentileTextColor(pct1)}`}>
                        p{pct1}
                      </span>
                    )}
                  </div>
                  {/* Player 2 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium w-16 truncate text-red-400">
                      {player2Name}
                    </span>
                    <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
                      <div
                        className="h-full rounded bg-red-500 transition-all"
                        style={{ width: `${val2 !== undefined ? Math.max((val2 / maxVal) * 100, 0.5) : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white w-12 text-right">
                      {val2 !== undefined ? val2 : '—'}
                    </span>
                    {pct2 !== null && (
                      <span className={`text-[10px] font-mono w-8 text-right ${percentileTextColor(pct2)}`}>
                        p{pct2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Wyscout Metrics Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-4 py-2">Metric</th>
                <th className="text-right px-4 py-2 text-blue-400">{player1Name}</th>
                <th className="text-right px-4 py-2 text-red-400">{player2Name}</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(allMetrics.entries()).map(([key, { m1, m2 }]) => {
                const val1 = m1?.value;
                const val2 = m2?.value;
                if (val1 === undefined && val2 === undefined) return null;

                const pct1 = m1 ? getPercentile(m1) : null;
                const pct2 = m2 ? getPercentile(m2) : null;
                const maxPct = Math.max(pct1 ?? -1, pct2 ?? -1);

                return (
                  <tr key={key} className="border-b border-zinc-800/30 hover:bg-zinc-800/30">
                    <td className="px-4 py-2 text-zinc-400">{m1?.label || m2?.label || key}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`font-mono ${pct1 === maxPct && maxPct >= 0 ? 'font-bold text-white' : 'text-zinc-300'}`}>
                        {val1 !== undefined ? val1 : '—'}
                      </span>
                      {pct1 !== null && (
                        <span className={`text-xs ml-1.5 ${percentileTextColor(pct1)}`}>p{pct1}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className={`font-mono ${pct2 === maxPct && maxPct >= 0 ? 'font-bold text-white' : 'text-zinc-300'}`}>
                        {val2 !== undefined ? val2 : '—'}
                      </span>
                      {pct2 !== null && (
                        <span className={`text-xs ml-1.5 ${percentileTextColor(pct2)}`}>p{pct2}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

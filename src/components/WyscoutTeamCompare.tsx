'use client';

import { useEffect, useState, useMemo } from 'react';
import { RadarChart } from '@/components/RadarChart';

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

type CompareMode = 'league' | 'global';

interface TeamPlayer {
  playerId: string | null;
  name: string;
}

// ─── Percentile color utilities ─────────────────────────────────────────────

function percentileTextColor(pct: number): string {
  if (pct >= 81) return 'text-emerald-400';
  if (pct >= 61) return 'text-green-400';
  if (pct >= 41) return 'text-yellow-400';
  if (pct >= 21) return 'text-amber-400';
  return 'text-red-400';
}

// ─── ALL-ROUND KEYS (standard 10-metric radar for aggregation) ──────────

const ALLROUND_KEYS = [
  'Passes per 90', 'Accurate passes, %', 'Progressive passes per 90',
  'Crosses per 90', 'Offensive duels won, %', 'Defensive duels per 90',
  'Aerial duels per 90', 'Touches in box per 90', 'Fouls per 90',
  'Key passes per 90',
];

const ALLROUND_LABELS = [
  'Passes /90', 'Pass Acc %', 'Prog Pass /90',
  'Crosses /90', 'Off Duels %', 'Def Duels /90',
  'Aerial /90', 'Box Touch /90', 'Fouls /90',
  'Key Pass /90',
];

// ─── Component ──────────────────────────────────────────────────────────────

interface WyscoutTeamCompareProps {
  team1PlayerIds: string[];
  team2PlayerIds: string[];
  team1Name: string;
  team2Name: string;
}

export function WyscoutTeamCompare({
  team1PlayerIds,
  team2PlayerIds,
  team1Name,
  team2Name,
}: WyscoutTeamCompareProps) {
  const [team1Data, setTeam1Data] = useState<PercentileWyscoutData[]>([]);
  const [team2Data, setTeam2Data] = useState<PercentileWyscoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState<CompareMode>('league');

  useEffect(() => {
    if (team1PlayerIds.length === 0 && team2PlayerIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchTeam = async (ids: string[]): Promise<PercentileWyscoutData[]> => {
      const results: PercentileWyscoutData[] = [];
      // Fetch in batches of 10 to avoid overwhelming
      for (let i = 0; i < ids.length; i += 10) {
        const batch = ids.slice(i, i + 10);
        const responses = await Promise.all(
          batch.map(id =>
            fetch(`/api/players/${id}/wyscout`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );
        for (const r of responses) {
          if (r?.hasPercentiles) results.push(r);
        }
      }
      return results;
    };

    Promise.all([
      fetchTeam(team1PlayerIds),
      fetchTeam(team2PlayerIds),
    ]).then(([d1, d2]) => {
      setTeam1Data(d1);
      setTeam2Data(d2);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [team1PlayerIds, team2PlayerIds]);

  // Aggregate team averages for allround metrics
  const aggregateTeam = useMemo(() => {
    return (data: PercentileWyscoutData[]) => {
      if (data.length === 0) return null;

      const avgPercentiles: number[] = ALLROUND_KEYS.map((key, ki) => {
        let sum = 0;
        let count = 0;
        for (const player of data) {
          const m = player.allround.find(a => a.key === key);
          if (m) {
            const pct = compareMode === 'league' ? m.percentile : m.gp;
            // Skip 50 defaults (missing data)
            if (m.value !== 0 || pct !== 50) {
              sum += pct;
              count++;
            }
          }
        }
        return count > 0 ? Math.round(sum / count) : 0;
      });

      const avgValues: number[] = ALLROUND_KEYS.map((key) => {
        let sum = 0;
        let count = 0;
        for (const player of data) {
          const m = player.allround.find(a => a.key === key);
          if (m && (m.value !== 0 || m.percentile !== 50)) {
            sum += m.value;
            count++;
          }
        }
        return count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
      });

      return { avgPercentiles, avgValues, playerCount: data.length };
    };
  }, [compareMode]);

  if (loading) {
    return (
      <div className="animate-pulse h-20 bg-zinc-900 rounded-xl border border-zinc-800" />
    );
  }

  const agg1 = aggregateTeam(team1Data);
  const agg2 = aggregateTeam(team2Data);

  if (!agg1 && !agg2) return null;

  const compareModeLabel = compareMode === 'league'
    ? 'League percentiles'
    : 'Global percentiles';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-800/50 to-transparent" />
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-[0.15em]">
          📊 Wyscout Team Metrics
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-800/50 to-transparent" />
      </div>

      {/* Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-zinc-500">
            {agg1 ? `${team1Name}: ${agg1.playerCount} players with Wyscout data` : ''}
            {agg1 && agg2 ? ' · ' : ''}
            {agg2 ? `${team2Name}: ${agg2.playerCount} players with Wyscout data` : ''}
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
      {agg1 && agg2 && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-1">📊 Avg Percentile Radar</h3>
          <p className="text-xs text-zinc-500 mb-4">{compareModeLabel} · Squad averages</p>
          <div className="max-w-lg mx-auto">
            <RadarChart
              labels={ALLROUND_LABELS}
              values={agg1.avgPercentiles}
              maxValue={100}
              mode="percentile"
              displayValues={agg1.avgValues}
              percentiles={agg1.avgPercentiles}
              comparisonValues={agg2.avgPercentiles}
              comparisonColor="#ef4444"
            />
          </div>
          <div className="flex justify-center gap-6 mt-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> {team1Name}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-500 inline-block rounded" /> {team2Name}
            </span>
          </div>
        </div>
      )}

      {/* Bar Graph Comparisons */}
      {agg1 && agg2 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-1">📊 Avg Metric Comparison</h3>
          <p className="text-xs text-zinc-500 mb-4">Squad-averaged per-90 values and percentiles</p>
          <div className="space-y-3">
            {ALLROUND_KEYS.map((key, i) => {
              const val1 = agg1.avgValues[i];
              const val2 = agg2.avgValues[i];
              const pct1 = agg1.avgPercentiles[i];
              const pct2 = agg2.avgPercentiles[i];
              const maxVal = Math.max(val1, val2, 0.01);

              return (
                <div key={key} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-400">{ALLROUND_LABELS[i]}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium w-20 truncate text-blue-400">{team1Name}</span>
                      <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
                        <div
                          className="h-full rounded bg-blue-500 transition-all"
                          style={{ width: `${Math.max((val1 / maxVal) * 100, 0.5)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-white w-14 text-right">{val1}</span>
                      <span className={`text-[10px] font-mono w-8 text-right ${percentileTextColor(pct1)}`}>
                        p{pct1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium w-20 truncate text-red-400">{team2Name}</span>
                      <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
                        <div
                          className="h-full rounded bg-red-500 transition-all"
                          style={{ width: `${Math.max((val2 / maxVal) * 100, 0.5)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-white w-14 text-right">{val2}</span>
                      <span className={`text-[10px] font-mono w-8 text-right ${percentileTextColor(pct2)}`}>
                        p{pct2}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metrics Table */}
      {agg1 && agg2 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="font-semibold text-white">Metrics Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2">Metric</th>
                  <th className="text-right px-4 py-2 text-blue-400">{team1Name}</th>
                  <th className="text-right px-4 py-2 text-red-400">{team2Name}</th>
                </tr>
              </thead>
              <tbody>
                {ALLROUND_KEYS.map((key, i) => {
                  const pct1 = agg1.avgPercentiles[i];
                  const pct2 = agg2.avgPercentiles[i];
                  const maxPct = Math.max(pct1, pct2);
                  return (
                    <tr key={key} className="border-b border-zinc-800/30 hover:bg-zinc-800/30">
                      <td className="px-4 py-2 text-zinc-400">{ALLROUND_LABELS[i]}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-mono ${pct1 === maxPct ? 'font-bold text-white' : 'text-zinc-300'}`}>
                          {agg1.avgValues[i]}
                        </span>
                        <span className={`text-xs ml-1.5 ${percentileTextColor(pct1)}`}>p{pct1}</span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-mono ${pct2 === maxPct ? 'font-bold text-white' : 'text-zinc-300'}`}>
                          {agg2.avgValues[i]}
                        </span>
                        <span className={`text-xs ml-1.5 ${percentileTextColor(pct2)}`}>p{pct2}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

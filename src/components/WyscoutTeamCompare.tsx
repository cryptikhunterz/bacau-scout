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

// ─── Percentile color utilities ─────────────────────────────────────────────

function percentileTextColor(pct: number): string {
  if (pct >= 81) return 'text-emerald-400';
  if (pct >= 61) return 'text-green-400';
  if (pct >= 41) return 'text-yellow-400';
  if (pct >= 21) return 'text-amber-400';
  return 'text-red-400';
}

function formatLabel(key: string): string {
  return key
    .replace(/ per 90/g, ' /90')
    .replace(/, %/g, ' %')
    .replace(/Successful /g, '');
}

// ─── Dynamic aggregation (no hardcoded keys) ────────────────────────────────

function buildDynamicAggregate(
  playerData: PercentileWyscoutData[],
  metricKeys: string[],
  compareMode: CompareMode,
) {
  if (playerData.length === 0 || metricKeys.length === 0) return null;

  const avgPercentiles = metricKeys.map((key) => {
    let sum = 0;
    let count = 0;
    for (const player of playerData) {
      const allMetrics = [...player.radar, ...player.allround];
      const m = allMetrics.find(a => a.key === key);
      if (m) {
        const pct = compareMode === 'league' ? (m.percentile ?? m.gp) : (m.gp ?? m.percentile);
        if (m.value !== 0 || pct !== 50) {
          sum += pct;
          count++;
        }
      }
    }
    return count > 0 ? Math.round(sum / count) : 0;
  });

  const avgValues = metricKeys.map((key) => {
    let sum = 0;
    let count = 0;
    for (const player of playerData) {
      const allMetrics = [...player.radar, ...player.allround];
      const m = allMetrics.find(a => a.key === key);
      if (m && (m.value !== 0 || m.percentile !== 50)) {
        sum += m.value;
        count++;
      }
    }
    return count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
  });

  return { avgPercentiles, avgValues, playerCount: playerData.length };
}

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

    async function fetchTeamData(ids: string[]): Promise<PercentileWyscoutData[]> {
      const results: PercentileWyscoutData[] = [];
      for (const id of ids) {
        try {
          const res = await fetch(`/api/players/${id}/wyscout`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data?.hasPercentiles) results.push(data);
        } catch { /* skip */ }
      }
      return results;
    }

    Promise.all([
      fetchTeamData(team1PlayerIds),
      fetchTeamData(team2PlayerIds),
    ]).then(([d1, d2]) => {
      setTeam1Data(d1);
      setTeam2Data(d2);
      setLoading(false);
    });
  }, [team1PlayerIds, team2PlayerIds]);

  // Build DYNAMIC union of all metric keys
  const unionKeys = useMemo(() => {
    const keySet = new Set<string>();
    for (const p of [...team1Data, ...team2Data]) {
      for (const m of [...p.radar, ...p.allround]) {
        keySet.add(m.key);
      }
    }
    return Array.from(keySet).sort();
  }, [team1Data, team2Data]);

  const radarKeys = unionKeys.slice(0, 16);
  const radarLabels = radarKeys.map(formatLabel);

  const agg1 = useMemo(
    () => buildDynamicAggregate(team1Data, unionKeys, compareMode),
    [team1Data, unionKeys, compareMode],
  );
  const agg2 = useMemo(
    () => buildDynamicAggregate(team2Data, unionKeys, compareMode),
    [team2Data, unionKeys, compareMode],
  );

  if (loading) {
    return (
      <div className="animate-pulse h-20 bg-zinc-900 rounded-xl border border-zinc-800" />
    );
  }

  if (!agg1 || !agg2 || radarKeys.length < 3) return null;

  // Build radar values from the union keys (subset for radar)
  const radarPct1 = radarKeys.map((key) => {
    const idx = unionKeys.indexOf(key);
    return idx >= 0 ? agg1.avgPercentiles[idx] : 0;
  });
  const radarPct2 = radarKeys.map((key) => {
    const idx = unionKeys.indexOf(key);
    return idx >= 0 ? agg2.avgPercentiles[idx] : 0;
  });

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-800/50 to-transparent" />
        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em]">
          Team Comparison (Wyscout)
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-800/50 to-transparent" />
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setCompareMode('league')}
          className={`px-3 py-1 text-xs font-medium rounded-l-md border transition-colors ${
            compareMode === 'league'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          🏆 League
        </button>
        <button
          onClick={() => setCompareMode('global')}
          className={`px-3 py-1 text-xs font-medium rounded-r-md border transition-colors ${
            compareMode === 'global'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          🌍 Global
        </button>
      </div>

      {/* Radar */}
      <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
        <RadarChart
          labels={radarLabels}
          values={radarPct1}
          maxValue={100}
          mode="percentile"
          comparisonValues={radarPct2}
          comparisonColor="#ef4444"
        />
        <div className="flex justify-center gap-6 mt-2 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block rounded bg-blue-500" />
            <span className="text-blue-400">{team1Name} ({agg1.playerCount})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block rounded bg-red-500" />
            <span className="text-red-400">{team2Name} ({agg2.playerCount})</span>
          </span>
        </div>
      </div>

      {/* Stat Bars — DYNAMIC */}
      <div className="space-y-2">
        {unionKeys.map((key) => {
          const idx = unionKeys.indexOf(key);
          const v1 = agg1.avgValues[idx];
          const v2 = agg2.avgValues[idx];
          const p1 = agg1.avgPercentiles[idx];
          const p2 = agg2.avgPercentiles[idx];
          const maxVal = Math.max(v1, v2, 0.01);

          return (
            <div key={key}>
              <div className="text-[10px] text-zinc-500 mb-0.5">{formatLabel(key)}</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-blue-400 w-10 text-right font-mono">{v1}</span>
                <div className="flex-1 h-3 bg-zinc-800 rounded overflow-hidden">
                  <div className="h-full bg-blue-500 rounded" style={{ width: `${(v1 / maxVal) * 100}%` }} />
                </div>
                <div className="flex-1 h-3 bg-zinc-800 rounded overflow-hidden flex justify-end">
                  <div className="h-full bg-red-500 rounded" style={{ width: `${(v2 / maxVal) * 100}%` }} />
                </div>
                <span className="text-[10px] text-red-400 w-10 font-mono">{v2}</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className={percentileTextColor(p1)}>p{p1}</span>
                <span className={percentileTextColor(p2)}>p{p2}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

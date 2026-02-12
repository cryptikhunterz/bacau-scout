'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { RadarChart } from '@/components/RadarChart';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TeamPlayer {
  name: string;
  position: string | null;
  positionGroup: string;
  age: number | null;
  marketValue: string | null;
  marketValueNum: number | null;
  appearances: number | null;
  goals: number | null;
  assists: number | null;
  playerId: string | null;
  photoUrl: string | null;
}

interface TeamData {
  club: string;
  league: string | null;
  squadSize: number;
  avgAge: number;
  avgMarketValue: number;
  avgMarketValueFormatted: string;
  totalMarketValue: number;
  totalMarketValueFormatted: string;
  positionBreakdown: { GK: number; DEF: number; MID: number; FWD: number };
  totalAppearances: number;
  totalGoals: number;
  totalAssists: number;
  players: TeamPlayer[];
}

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

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_COMPARE = 3;

const COMPARE_COLORS = [
  { label: 'blue', text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40', bar: 'bg-blue-500', dot: '#3b82f6' },
  { label: 'red', text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40', bar: 'bg-red-500', dot: '#ef4444' },
  { label: 'green', text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40', bar: 'bg-green-500', dot: '#22c55e' },
];

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

/* ------------------------------------------------------------------ */
/*  Utility                                                            */
/* ------------------------------------------------------------------ */

function percentileTextColor(pct: number): string {
  if (pct >= 81) return 'text-emerald-400';
  if (pct >= 61) return 'text-green-400';
  if (pct >= 41) return 'text-yellow-400';
  if (pct >= 21) return 'text-amber-400';
  return 'text-red-400';
}

/* ------------------------------------------------------------------ */
/*  Team Search                                                        */
/* ------------------------------------------------------------------ */

function TeamSearch({
  onSelect,
  disabled,
}: {
  onSelect: (club: string) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(value), 250);
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={disabled ? 'Maximum teams reached' : 'Search team to add...'}
        disabled={disabled}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />
      {loading && (
        <div className="absolute right-3 top-3 text-zinc-500 text-sm">...</div>
      )}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-[300px] overflow-auto z-50">
          {results.map((club) => (
            <button
              key={club}
              onClick={() => {
                onSelect(club);
                setQuery('');
                setResults([]);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 text-left transition-colors"
            >
              <span className="text-white text-sm font-medium">{club}</span>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl p-4 text-center text-zinc-500">
          No teams found
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Aggregate team Wyscout data                                        */
/* ------------------------------------------------------------------ */

function aggregateTeamData(
  playerData: PercentileWyscoutData[],
  compareMode: CompareMode,
) {
  if (playerData.length === 0) return null;

  const avgPercentiles: number[] = ALLROUND_KEYS.map((key) => {
    let sum = 0;
    let count = 0;
    for (const player of playerData) {
      const m = player.allround.find(a => a.key === key);
      if (m) {
        const pct = compareMode === 'league' ? m.percentile : m.gp;
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
    for (const player of playerData) {
      const m = player.allround.find(a => a.key === key);
      if (m && (m.value !== 0 || m.percentile !== 50)) {
        sum += m.value;
        count++;
      }
    }
    return count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
  });

  return { avgPercentiles, avgValues, playerCount: playerData.length };
}

/* ------------------------------------------------------------------ */
/*  Squad List                                                         */
/* ------------------------------------------------------------------ */

const posGroupColors: Record<string, string> = {
  GK: 'bg-yellow-600',
  DEF: 'bg-blue-600',
  MID: 'bg-green-600',
  FWD: 'bg-red-600',
};

function SquadList({
  team,
  color,
}: {
  team: TeamData;
  color: 'blue' | 'red' | 'green';
}) {
  const borderColor = color === 'blue' ? 'border-blue-500/30' : color === 'red' ? 'border-red-500/30' : 'border-green-500/30';
  const headerBg = color === 'blue' ? 'bg-blue-500/10' : color === 'red' ? 'bg-red-500/10' : 'bg-green-500/10';
  const headerText = color === 'blue' ? 'text-blue-400' : color === 'red' ? 'text-red-400' : 'text-green-400';

  return (
    <div className={`border ${borderColor} rounded-xl overflow-hidden`}>
      <div className={`${headerBg} px-4 py-3`}>
        <h4 className={`font-bold ${headerText}`}>{team.club}</h4>
        <p className="text-xs text-zinc-500">{team.squadSize} players • {team.league || 'Unknown league'}</p>
      </div>
      <div className="divide-y divide-zinc-800/50">
        {team.players.map((p, i) => (
          <div
            key={`${p.playerId || p.name}-${i}`}
            className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/30 transition-colors"
          >
            <span
              className={`inline-block px-1.5 py-0.5 text-[10px] font-bold text-white rounded ${
                posGroupColors[p.positionGroup] || 'bg-zinc-600'
              }`}
            >
              {p.positionGroup}
            </span>
            <div className="flex-1 min-w-0">
              {p.playerId ? (
                <Link
                  href={`/player/${p.playerId}`}
                  className="text-sm text-white hover:text-blue-400 truncate block"
                >
                  {p.name}
                </Link>
              ) : (
                <span className="text-sm text-white truncate block">{p.name}</span>
              )}
              <span className="text-xs text-zinc-500">{p.position || '-'}</span>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-zinc-400">{p.age ? `${p.age}y` : '-'}</div>
              <div className="text-xs text-green-400">{p.marketValue || '-'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CompareTeamsPage() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [teamWyscoutData, setTeamWyscoutData] = useState<Record<string, PercentileWyscoutData[]>>({});
  const [loading, setLoading] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>('global');

  const loadTeam = async (club: string) => {
    if (teams.length >= MAX_COMPARE) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${encodeURIComponent(club)}`);
      if (!res.ok) return;
      const teamData: TeamData = await res.json();
      setTeams(prev => [...prev, teamData]);

      // Fetch Wyscout data for all players in the team
      const playerIds = teamData.players.filter(p => p.playerId).map(p => p.playerId!);
      const wyscoutResults: PercentileWyscoutData[] = [];
      
      for (let i = 0; i < playerIds.length; i += 10) {
        const batch = playerIds.slice(i, i + 10);
        const responses = await Promise.all(
          batch.map(id =>
            fetch(`/api/players/${id}/wyscout`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );
        for (const r of responses) {
          if (r?.hasPercentiles) wyscoutResults.push(r);
        }
      }
      
      setTeamWyscoutData(prev => ({ ...prev, [club]: wyscoutResults }));
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeTeam = (club: string) => {
    setTeams(prev => prev.filter(t => t.club !== club));
    setTeamWyscoutData(prev => {
      const next = { ...prev };
      delete next[club];
      return next;
    });
  };

  // Aggregate data for each team
  const teamAggregates = useMemo(() => {
    const result: Record<string, ReturnType<typeof aggregateTeamData>> = {};
    for (const team of teams) {
      const wd = teamWyscoutData[team.club] || [];
      result[team.club] = aggregateTeamData(wd, compareMode);
    }
    return result;
  }, [teams, teamWyscoutData, compareMode]);

  const hasAllAggregates = teams.length >= 2 && teams.every(t => teamAggregates[t.club]);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Team Comparison</h1>
            <p className="text-sm text-zinc-500">Compare up to {MAX_COMPARE} teams side by side</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/compare"
              className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors"
            >
              Players
            </Link>
            <Link
              href="/search"
              className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors"
            >
              Search
            </Link>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto flex">
          <Link
            href="/compare"
            className="px-6 py-3 text-sm font-medium text-zinc-400 hover:text-white border-b-2 border-transparent hover:border-zinc-500 transition-colors"
          >
            Players
          </Link>
          <div className="px-6 py-3 text-sm font-medium text-white border-b-2 border-blue-500">
            Teams
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Search */}
        <TeamSearch
          onSelect={loadTeam}
          disabled={teams.length >= MAX_COMPARE}
        />

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Selected Team Cards */}
        {teams.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {teams.map((t, idx) => {
              const color = COMPARE_COLORS[idx];
              const agg = teamAggregates[t.club];
              return (
                <div
                  key={t.club}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${color.bg} ${color.border}`}
                >
                  <div>
                    <div className={`text-sm font-bold ${color.text}`}>{t.club}</div>
                    <div className="text-xs text-zinc-500">
                      {t.league || 'Unknown league'} • {t.squadSize} players
                    </div>
                    <div className="text-xs text-green-400 font-medium">{t.totalMarketValueFormatted}</div>
                    {agg && (
                      <div className="text-[10px] text-zinc-600">{agg.playerCount} with Wyscout data</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeTeam(t.club)}
                    className="ml-2 text-zinc-500 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {teams.length === 0 && !loading && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">🏟️ vs 🏟️</div>
            <div className="text-zinc-500 text-lg mb-2">No teams selected</div>
            <div className="text-zinc-600 text-sm">Search and add up to {MAX_COMPARE} teams to compare</div>
          </div>
        )}

        {/* Comparison content */}
        {teams.length >= 2 && (
          <div className="space-y-6">
            {/* Percentile mode toggle */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-zinc-500">
                  {teams.map((t, i) => {
                    const agg = teamAggregates[t.club];
                    return (agg ? `${t.club}: ${agg.playerCount} players with Wyscout data` : '');
                  }).filter(Boolean).join(' · ')}
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
            {hasAllAggregates && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Percentile Radar */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">📊 Percentile Radar</h2>
                  <p className="text-xs text-zinc-500 mb-4">
                    {compareMode === 'global' ? 'Global percentile values' : 'League percentile values'} · Squad averages
                  </p>
                  {(() => {
                    const agg1 = teamAggregates[teams[0].club]!;
                    const agg2 = teamAggregates[teams[1].club]!;
                    return (
                      <>
                        <RadarChart
                          labels={ALLROUND_LABELS}
                          values={agg1.avgPercentiles}
                          maxValue={100}
                          mode="percentile"
                          displayValues={agg1.avgValues}
                          percentiles={agg1.avgPercentiles}
                          comparisonValues={agg2.avgPercentiles}
                          comparisonColor={COMPARE_COLORS[1].dot}
                        />
                        <div className="flex justify-center gap-6 mt-2 text-xs">
                          {teams.slice(0, 2).map((t, idx) => (
                            <span key={t.club} className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-0.5 inline-block rounded"
                                style={{ backgroundColor: COMPARE_COLORS[idx].dot }}
                              />
                              <span className={COMPARE_COLORS[idx].text}>{t.club}</span>
                            </span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Raw Stats Radar */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">📈 Raw Stats</h2>
                  <p className="text-xs text-zinc-500 mb-4">
                    Actual values · Each axis scaled independently
                  </p>
                  {(() => {
                    const agg1 = teamAggregates[teams[0].club]!;
                    const agg2 = teamAggregates[teams[1].club]!;
                    // Build per-axis max values for raw mode
                    const maxValues = ALLROUND_KEYS.map((_, i) => {
                      const v1 = agg1.avgValues[i];
                      const v2 = agg2.avgValues[i];
                      const max = Math.max(v1, v2);
                      if (max <= 0) return 1;
                      if (max <= 1) return Math.ceil(max * 10) / 10;
                      if (max <= 10) return Math.ceil(max);
                      return Math.ceil(max / 5) * 5;
                    });
                    return (
                      <>
                        <RadarChart
                          labels={ALLROUND_LABELS}
                          values={agg1.avgValues}
                          maxValue={1}
                          maxValues={maxValues}
                          mode="raw"
                          color="#3b82f6"
                          comparisonValues={agg2.avgValues}
                          comparisonColor={COMPARE_COLORS[1].dot}
                        />
                        <div className="flex justify-center gap-6 mt-2 text-xs">
                          {teams.slice(0, 2).map((t, idx) => (
                            <span key={t.club} className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-0.5 inline-block rounded"
                                style={{ backgroundColor: COMPARE_COLORS[idx].dot }}
                              />
                              <span className={COMPARE_COLORS[idx].text}>{t.club}</span>
                            </span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Stat Comparison — stacked horizontal bars */}
            {hasAllAggregates && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-1">📊 Stat Comparison</h2>
                <p className="text-xs text-zinc-500 mb-4">Squad-averaged per-90 values and percentiles</p>
                <div className="space-y-3">
                  {ALLROUND_KEYS.map((key, i) => {
                    const values = teams.map(t => {
                      const agg = teamAggregates[t.club];
                      return {
                        val: agg?.avgValues[i] ?? 0,
                        pct: agg?.avgPercentiles[i] ?? 0,
                      };
                    });
                    const maxVal = Math.max(...values.map(v => v.val), 0.01);
                    const barColors = ['bg-blue-500', 'bg-red-500', 'bg-green-500'];
                    const textColors = ['text-blue-400', 'text-red-400', 'text-green-400'];

                    return (
                      <div key={key} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-zinc-400">{ALLROUND_LABELS[i]}</span>
                        </div>
                        <div className="space-y-1">
                          {teams.map((t, idx) => {
                            const v = values[idx];
                            const width = v.val > 0 ? (v.val / maxVal) * 100 : 0;
                            return (
                              <div key={t.club} className="flex items-center gap-2">
                                <span className={`text-[10px] font-medium w-20 truncate ${textColors[idx]}`}>{t.club}</span>
                                <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
                                  <div
                                    className={`h-full rounded ${barColors[idx]} transition-all`}
                                    style={{ width: `${Math.max(width, 0.5)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-white w-14 text-right">{v.val}</span>
                                <span className={`text-[10px] font-mono w-8 text-right ${percentileTextColor(v.pct)}`}>
                                  p{v.pct}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Metrics Table */}
            {hasAllAggregates && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <h3 className="font-semibold text-white">Metrics Comparison</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                        <th className="text-left px-4 py-2">Metric</th>
                        {teams.map((t, idx) => (
                          <th key={t.club} className={`text-right px-4 py-2 ${COMPARE_COLORS[idx].text}`}>
                            {t.club}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ALLROUND_KEYS.map((key, i) => {
                        const values = teams.map(t => {
                          const agg = teamAggregates[t.club];
                          return {
                            val: agg?.avgValues[i] ?? 0,
                            pct: agg?.avgPercentiles[i] ?? 0,
                          };
                        });
                        const maxPct = Math.max(...values.map(v => v.pct));

                        return (
                          <tr key={key} className="border-b border-zinc-800/30 hover:bg-zinc-800/30">
                            <td className="px-4 py-2 text-zinc-400">{ALLROUND_LABELS[i]}</td>
                            {values.map((v, idx) => (
                              <td key={idx} className="px-4 py-2 text-right">
                                <span className={`font-mono ${v.pct === maxPct ? 'font-bold text-white' : 'text-zinc-300'}`}>
                                  {v.val}
                                </span>
                                <span className={`text-xs ml-1.5 ${percentileTextColor(v.pct)}`}>
                                  p{v.pct}
                                </span>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Squad Lists */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Full Squads</h3>
              <div className={`grid grid-cols-1 ${teams.length === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                {teams.map((t, idx) => (
                  <SquadList key={t.club} team={t} color={['blue', 'red', 'green'][idx] as 'blue' | 'red' | 'green'} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

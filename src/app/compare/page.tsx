'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { RadarChart } from '@/components/RadarChart';
import { PercentileRadar } from '@/components/PercentileRadar';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SearchResult {
  playerId: string;
  name: string;
  position: string | null;
  club: string | null;
  age: string | null;
}

interface PlayerDetail {
  id: string;
  name: string;
  position: string | null;
  age: number | null;
  nationality: string | null;
  club: string | null;
  league: string | null;
  marketValue: string | null;
  height: string | null;
  foot: string | null;
  photoUrl: string | null;
  careerTotals: {
    matches: number;
    goals: number;
    assists: number;
    minutes: number;
  } | null;
  stats: Array<{
    season: string;
    competition: string;
    matches: number;
    goals: number;
    assists: number;
  }>;
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

const PG_LABELS: Record<string, string> = {
  GK: 'Goalkeeper',
  CB: 'Centre-Back',
  WB: 'Wing-Back',
  DM: 'Def. Midfield',
  CM: 'Central Midfield',
  AM: 'Att. Midfield',
  FW: 'Forward',
};

const POSITION_GROUPS = ['GK', 'CB', 'WB', 'DM', 'CM', 'AM', 'FW'];

/** Canonical radar templates per position group — used when switching templates */
const PG_RADAR_TEMPLATES: Record<string, { key: string; label: string }[]> = {
  GK: [
    { key: 'Save rate, %', label: 'Save %' },
    { key: 'xG against per 90', label: 'xGA /90' },
    { key: 'Shots against per 90', label: 'ShotA /90' },
    { key: 'Exits per 90', label: 'Exits /90' },
    { key: 'Accurate passes, %', label: 'Pass Acc %' },
    { key: 'Conceded goals per 90', label: 'GA /90' },
  ],
  CB: [
    { key: 'Defensive duels won, %', label: 'Def Duels %' },
    { key: 'Aerial duels won, %', label: 'Aerial %' },
    { key: 'Accurate passes, %', label: 'Pass Acc %' },
    { key: 'Interceptions per 90', label: 'Intercept /90' },
    { key: 'Successful defensive actions per 90', label: 'Def Actions /90' },
    { key: 'Defensive duels per 90', label: 'Def Duels /90' },
    { key: 'Shots blocked per 90', label: 'Blocks /90' },
    { key: 'Fouls per 90', label: 'Fouls /90' },
  ],
  WB: [
    { key: 'Defensive duels won, %', label: 'Def Duels %' },
    { key: 'Offensive duels won, %', label: 'Off Duels %' },
    { key: 'Aerial duels won, %', label: 'Aerial %' },
    { key: 'Crosses per 90', label: 'Crosses /90' },
    { key: 'Successful dribbles, %', label: 'Dribble %' },
    { key: 'Key passes per 90', label: 'Chances /90' },
    { key: 'xG per 90', label: 'xG /90' },
    { key: 'Fouls per 90', label: 'Fouls /90' },
  ],
  DM: [
    { key: 'Accurate passes, %', label: 'Pass Acc %' },
    { key: 'Defensive duels won, %', label: 'Def Duels %' },
    { key: 'Successful defensive actions per 90', label: 'Def Actions /90' },
    { key: 'Passes per 90', label: 'Passes /90' },
    { key: 'Accurate long passes, %', label: 'Long Pass %' },
    { key: 'Aerial duels won, %', label: 'Aerial %' },
    { key: 'Fouls per 90', label: 'Fouls /90' },
  ],
  CM: [
    { key: 'Accurate passes, %', label: 'Pass Acc %' },
    { key: 'Key passes per 90', label: 'Chances /90' },
    { key: 'Passes per 90', label: 'Passes /90' },
    { key: 'Defensive duels won, %', label: 'Def Duels %' },
    { key: 'Successful defensive actions per 90', label: 'Def Actions /90' },
    { key: 'Interceptions per 90', label: 'Intercept /90' },
  ],
  AM: [
    { key: 'Key passes per 90', label: 'Chances /90' },
    { key: 'xG per 90', label: 'xG /90' },
    { key: 'Successful dribbles, %', label: 'Dribble %' },
    { key: 'Progressive passes per 90', label: 'Prog Pass /90' },
    { key: 'Progressive runs per 90', label: 'Prog Runs /90' },
    { key: 'Shots on target, %', label: 'SoT %' },
    { key: 'Passes to penalty area per 90', label: 'PA Pass /90' },
  ],
  FW: [
    { key: 'xG per 90', label: 'xG /90' },
    { key: 'Goals per 90', label: 'Goals /90' },
    { key: 'Shots on target, %', label: 'SoT %' },
    { key: 'Key passes per 90', label: 'Chances /90' },
    { key: 'Successful dribbles, %', label: 'Dribble %' },
    { key: 'Crosses per 90', label: 'Crosses /90' },
    { key: 'Aerial duels won, %', label: 'Aerial %' },
    { key: 'xA per 90', label: 'xA /90' },
  ],
};

const ALLROUND_TEMPLATE: { key: string; label: string }[] = [
  { key: 'Passes per 90', label: 'Passes /90' },
  { key: 'Accurate passes, %', label: 'Pass Acc %' },
  { key: 'Progressive passes per 90', label: 'Prog Pass /90' },
  { key: 'Crosses per 90', label: 'Crosses /90' },
  { key: 'Offensive duels won, %', label: 'Off Duels %' },
  { key: 'Defensive duels per 90', label: 'Def Duels /90' },
  { key: 'Aerial duels per 90', label: 'Aerial /90' },
  { key: 'Touches in box per 90', label: 'Box Touch /90' },
  { key: 'Fouls per 90', label: 'Fouls /90' },
  { key: 'Key passes per 90', label: 'Key Pass /90' },
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
/*  Player Search Autocomplete                                         */
/* ------------------------------------------------------------------ */

function PlayerSearch({
  onSelect,
  disabled,
}: {
  onSelect: (p: SearchResult) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
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
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`);
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
        placeholder={disabled ? 'Maximum players reached' : 'Search player to add...'}
        disabled={disabled}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />
      {loading && (
        <div className="absolute right-3 top-3 text-zinc-500 text-sm">...</div>
      )}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-[300px] overflow-auto z-50">
          {results.map((r) => (
            <button
              key={r.playerId}
              onClick={() => {
                onSelect(r);
                setQuery('');
                setResults([]);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 text-left transition-colors"
            >
              {r.position && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-zinc-700/50 text-zinc-300 border-zinc-600/50">
                  {r.position}
                </span>
              )}
              <span className="text-white text-sm font-medium">{r.name}</span>
              <span className="text-zinc-500 text-xs ml-auto">{r.club || ''}</span>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl p-4 text-center text-zinc-500">
          No players found
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ComparePage() {
  const [players, setPlayers] = useState<PlayerDetail[]>([]);
  const [wyscoutData, setWyscoutData] = useState<Record<string, PercentileWyscoutData>>({});
  const [loading, setLoading] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>('league');
  const [radarTemplate, setRadarTemplate] = useState<string>('');

  const loadPlayer = async (searchResult: SearchResult) => {
    if (players.length >= MAX_COMPARE) return;
    setLoading(true);
    try {
      const [playerRes, wyscoutRes] = await Promise.all([
        fetch(`/api/players/${searchResult.playerId}`),
        fetch(`/api/players/${searchResult.playerId}/wyscout`),
      ]);
      
      if (playerRes.ok) {
        const playerData = await playerRes.json();
        setPlayers(prev => [...prev, playerData]);
      }
      
      if (wyscoutRes.ok) {
        const wData = await wyscoutRes.json();
        if (wData?.hasPercentiles) {
          setWyscoutData(prev => ({ ...prev, [searchResult.playerId]: wData }));
          // Set default radar template from first player's position group
          if (players.length === 0 && wData.pg) {
            setRadarTemplate(wData.pg);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load player:', err);
    } finally {
      setLoading(false);
    }
  };

  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setWyscoutData(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const getPercentile = (m: RadarMetric) =>
    compareMode === 'league' ? (m.percentile ?? m.gp) : (m.gp ?? m.percentile);

  // Build metric keys for bar comparison — UNION of all players' metrics
  // Every player gets an entry for every metric (null if missing)
  const allMetrics = useMemo(() => {
    const metricsMap = new Map<string, { label: string; data: Map<string, { value: number; percentile: number }> }>();
    
    // First pass: collect all metric keys from all players
    for (const player of players) {
      const wd = wyscoutData[player.id];
      if (!wd) continue;
      
      const allWyscoutMetrics = [...wd.radar, ...wd.allround];
      const seen = new Set<string>();
      
      for (const m of allWyscoutMetrics) {
        if (seen.has(m.key)) continue;
        seen.add(m.key);
        
        if (!metricsMap.has(m.key)) {
          metricsMap.set(m.key, { label: m.label, data: new Map() });
        }
        metricsMap.get(m.key)!.data.set(player.id, {
          value: m.value,
          percentile: getPercentile(m),
        });
      }
    }
    
    return metricsMap;
  }, [players, wyscoutData, compareMode]);

  // Build radar overlay data using canonical position templates
  // KEEPS PG_RADAR_TEMPLATES — supplements with player data when template metrics are missing
  const radarOverlayData = useMemo(() => {
    const playersWithData = players.filter(p => wyscoutData[p.id]);
    if (playersWithData.length < 2) return null;

    // Use canonical template for the selected position group
    const templatePg = radarTemplate || wyscoutData[playersWithData[0].id]?.pg;
    if (!templatePg) return null;

    const template = PG_RADAR_TEMPLATES[templatePg];
    if (!template || template.length < 3) return null;

    // Start with template keys, then supplement if players lack those metrics
    let keys = template.map(t => t.key);
    let labels = template.map(t => t.label);

    // Check how many template metrics any player actually has
    const anyPlayerHas = (key: string) =>
      playersWithData.some(p => {
        const wd = wyscoutData[p.id];
        return [...wd.radar, ...wd.allround].some(m => m.key === key);
      });

    const coveredKeys = keys.filter(anyPlayerHas);

    // If fewer than 3 template keys have data, supplement with highest-percentile metrics from players
    if (coveredKeys.length < 3) {
      const templateKeySet = new Set(keys);
      const extraMetrics: { key: string; label: string; avgPct: number }[] = [];
      const seenKeys = new Set<string>();

      for (const p of playersWithData) {
        const wd = wyscoutData[p.id];
        for (const m of [...wd.radar, ...wd.allround]) {
          if (!templateKeySet.has(m.key) && !seenKeys.has(m.key)) {
            seenKeys.add(m.key);
            extraMetrics.push({ key: m.key, label: m.label, avgPct: getPercentile(m) });
          }
        }
      }

      extraMetrics.sort((a, b) => b.avgPct - a.avgPct);
      const needed = 3 - coveredKeys.length;
      const supplements = extraMetrics.slice(0, needed);
      keys = [...keys, ...supplements.map(s => s.key)];
      labels = [...labels, ...supplements.map(s => s.label)];
    }

    const playerRadarValues = playersWithData.map(p => {
      const wd = wyscoutData[p.id];
      const metricMap = new Map([...wd.radar, ...wd.allround].map(m => [m.key, m]));
      return {
        player: p,
        values: keys.map(k => {
          const m = metricMap.get(k);
          return m ? getPercentile(m) : 0;
        }),
        displayValues: keys.map(k => {
          const m = metricMap.get(k);
          return m ? m.value : 0;
        }),
      };
    });

    return { labels, playerRadarValues, templatePg };
  }, [players, wyscoutData, compareMode, radarTemplate]);

  // All-round radar overlay using canonical template — KEEPS ALLROUND_TEMPLATE
  // Supplements when fewer than 3 template metrics have data across all players
  const allroundOverlayData = useMemo(() => {
    const playersWithData = players.filter(p => wyscoutData[p.id]);
    if (playersWithData.length < 2) return null;

    let keys = ALLROUND_TEMPLATE.map(t => t.key);
    let labels = ALLROUND_TEMPLATE.map(t => t.label);

    // Check coverage
    const anyPlayerHas = (key: string) =>
      playersWithData.some(p => {
        const wd = wyscoutData[p.id];
        return [...wd.radar, ...wd.allround].some(m => m.key === key);
      });

    const coveredKeys = keys.filter(anyPlayerHas);

    if (coveredKeys.length < 3) {
      const templateKeySet = new Set(keys);
      const extraMetrics: { key: string; label: string; avgPct: number }[] = [];
      const seenKeys = new Set<string>();

      for (const p of playersWithData) {
        const wd = wyscoutData[p.id];
        for (const m of [...wd.radar, ...wd.allround]) {
          if (!templateKeySet.has(m.key) && !seenKeys.has(m.key)) {
            seenKeys.add(m.key);
            extraMetrics.push({ key: m.key, label: m.label, avgPct: getPercentile(m) });
          }
        }
      }

      extraMetrics.sort((a, b) => b.avgPct - a.avgPct);
      const needed = 3 - coveredKeys.length;
      const supplements = extraMetrics.slice(0, needed);
      keys = [...keys, ...supplements.map(s => s.key)];
      labels = [...labels, ...supplements.map(s => s.label)];
    }

    const playerRadarValues = playersWithData.map(p => {
      const wd = wyscoutData[p.id];
      const metricMap = new Map([...wd.radar, ...wd.allround].map(m => [m.key, m]));
      return {
        player: p,
        values: keys.map(k => {
          const m = metricMap.get(k);
          return m ? getPercentile(m) : 0;
        }),
        displayValues: keys.map(k => {
          const m = metricMap.get(k);
          return m ? m.value : 0;
        }),
      };
    });

    return { labels, playerRadarValues };
  }, [players, wyscoutData, compareMode]);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Player Comparison</h1>
            <p className="text-sm text-zinc-500">Compare up to {MAX_COMPARE} players side by side</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors"
            >
              Dashboard
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
          <div className="px-6 py-3 text-sm font-medium text-white border-b-2 border-blue-500">
            Players
          </div>
          <Link
            href="/compare/teams"
            className="px-6 py-3 text-sm font-medium text-zinc-400 hover:text-white border-b-2 border-transparent hover:border-zinc-500 transition-colors"
          >
            Teams
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Search */}
        <PlayerSearch
          onSelect={loadPlayer}
          disabled={players.length >= MAX_COMPARE}
        />

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Selected Player Cards */}
        {players.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {players.map((p, idx) => {
              const color = COMPARE_COLORS[idx];
              const wd = wyscoutData[p.id];
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${color.bg} ${color.border}`}
                >
                  {p.photoUrl && (
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover bg-zinc-800"
                    />
                  )}
                  <div>
                    <div className={`text-sm font-bold ${color.text}`}>{p.name}</div>
                    <div className="text-xs text-zinc-500">
                      {p.position} • {p.club || 'Unknown'}
                      {p.age ? ` • ${p.age}y` : ''}
                      {p.careerTotals ? ` • ${p.careerTotals.minutes.toLocaleString()} min` : ''}
                    </div>
                    {p.marketValue && (
                      <div className="text-xs text-green-400 font-medium">{p.marketValue}</div>
                    )}
                    {wd && (
                      <div className="text-[10px] text-zinc-600">{PG_LABELS[wd.pg] || wd.pg} • {wd.comp}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removePlayer(p.id)}
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
        {players.length === 0 && !loading && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">⚽ vs ⚽</div>
            <div className="text-zinc-500 text-lg mb-2">No players selected</div>
            <div className="text-zinc-600 text-sm">Search and add up to {MAX_COMPARE} players to compare</div>
          </div>
        )}

        {/* Comparison content */}
        {players.length >= 2 && (
          <div className="space-y-6">
            {/* Radar Template Selector */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-zinc-400 whitespace-nowrap">Radar Template</label>
                  <select
                    value={radarTemplate || (wyscoutData[players[0].id]?.pg ?? '')}
                    onChange={e => setRadarTemplate(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {POSITION_GROUPS.map(pg => (
                      <option key={pg} value={pg}>
                        {pg} — {PG_LABELS[pg] || pg}
                      </option>
                    ))}
                  </select>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Position Radar */}
              {radarOverlayData && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">📊 Percentile Radar</h2>
                  <p className="text-xs text-zinc-500 mb-4">
                    Using {PG_LABELS[radarOverlayData.templatePg] || radarOverlayData.templatePg} template · Percentile values
                  </p>
                  {(() => {
                    const d = radarOverlayData;
                    const primary = d.playerRadarValues[0];
                    const otherOverlays = d.playerRadarValues.slice(1).map((prd, idx) => ({
                      values: prd.values,
                      color: COMPARE_COLORS[idx + 1].dot,
                    }));
                    return (
                      <>
                        <RadarChart
                          labels={d.labels}
                          values={primary.values}
                          maxValue={100}
                          mode="percentile"
                          displayValues={primary.displayValues}
                          percentiles={primary.values}
                          overlays={otherOverlays}
                        />
                        <div className="flex justify-center gap-6 mt-2 text-[10px]">
                          {d.playerRadarValues.map((prd, idx) => (
                            <span key={prd.player.id} className="flex items-center gap-1">
                              <span
                                className="w-3 h-0.5 inline-block rounded"
                                style={{ backgroundColor: COMPARE_COLORS[idx].dot }}
                              />
                              <span className={COMPARE_COLORS[idx].text}>
                                {prd.player.name.split(' ').pop()}
                              </span>
                            </span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Enrichment-style Percentile Radar */}
              {allroundOverlayData && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">📈 Percentile Profile</h2>
                  <p className="text-xs text-zinc-500 mb-4">
                    All-round metrics · Enrichment-style radar
                  </p>
                  {(() => {
                    const d = allroundOverlayData;
                    const primary = d.playerRadarValues[0];
                    const otherOverlays = d.playerRadarValues.slice(1).map((prd, idx) => ({
                      values: prd.values,
                      color: COMPARE_COLORS[idx + 1].dot,
                    }));
                    return (
                      <>
                        <PercentileRadar
                          labels={d.labels}
                          values={primary.values}
                          displayValues={primary.displayValues}
                          percentiles={primary.values}
                          overlays={otherOverlays}
                        />
                        <div className="flex justify-center gap-6 mt-2 text-[10px]">
                          {d.playerRadarValues.map((prd, idx) => (
                            <span key={prd.player.id} className="flex items-center gap-1">
                              <span
                                className="w-3 h-0.5 inline-block rounded"
                                style={{ backgroundColor: COMPARE_COLORS[idx].dot }}
                              />
                              <span className={COMPARE_COLORS[idx].text}>
                                {prd.player.name.split(' ').pop()}
                              </span>
                            </span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Stat Comparison — stacked horizontal bars (fixed 0-100% percentile scale) */}
            {allMetrics.size > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-1">📊 Stat Comparison</h2>
                <p className="text-xs text-zinc-500 mb-4">Side-by-side bars · Fixed 0–100% percentile scale</p>
                <div className="space-y-3">
                  {Array.from(allMetrics.entries()).map(([key, { label, data }]) => {
                    const barColors = ['bg-blue-500', 'bg-red-500', 'bg-green-500'];
                    const textColors = ['text-blue-400', 'text-red-400', 'text-green-400'];

                    return (
                      <div key={key} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-zinc-400 truncate max-w-[250px]">{label}</span>
                        </div>
                        <div className="space-y-1">
                          {players.map((p, idx) => {
                            const d = data.get(p.id);
                            const val = d?.value;
                            const pct = d?.percentile ?? null;
                            // Fixed 0-100% scale based on percentile rank
                            const width = pct !== null ? pct : 0;
                            const shortName = p.name.split(' ').pop() || p.name;
                            const hasData = d !== undefined;

                            return (
                              <div key={p.id} className="flex items-center gap-2">
                                <span className={`text-[10px] font-medium w-16 truncate ${textColors[idx]}`}>
                                  {shortName}
                                </span>
                                <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
                                  {hasData && (
                                    <div
                                      className={`h-full rounded ${barColors[idx]} transition-all`}
                                      style={{ width: `${Math.max(width, 0.5)}%` }}
                                    />
                                  )}
                                </div>
                                <span className="text-xs font-mono text-white w-12 text-right">
                                  {val !== undefined ? val : '—'}
                                </span>
                                <span className={`text-[10px] font-mono w-8 text-right ${pct !== null ? percentileTextColor(pct) : 'text-zinc-600'}`}>
                                  {pct !== null ? `p${pct}` : '—'}
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
            {allMetrics.size > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <h3 className="font-semibold text-white">Metrics Comparison</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                        <th className="text-left px-4 py-2">Metric</th>
                        {players.map((p, idx) => (
                          <th key={p.id} className={`text-right px-4 py-2 ${COMPARE_COLORS[idx].text}`}>
                            {p.name.split(' ').pop()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Bio rows */}
                      <tr className="border-b border-zinc-800/50 bg-zinc-800/20">
                        <td className="px-4 py-2 text-zinc-400 font-medium">Market Value</td>
                        {players.map(p => (
                          <td key={p.id} className="px-4 py-2 text-right text-green-400 font-medium">
                            {p.marketValue || '—'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-zinc-800/50 bg-zinc-800/20">
                        <td className="px-4 py-2 text-zinc-400 font-medium">Minutes / Matches</td>
                        {players.map(p => (
                          <td key={p.id} className="px-4 py-2 text-right text-zinc-300">
                            {p.careerTotals ? `${p.careerTotals.minutes.toLocaleString()} / ${p.careerTotals.matches}` : '—'}
                          </td>
                        ))}
                      </tr>
                      {/* Wyscout metrics — shows ALL metrics, "—" for missing */}
                      {Array.from(allMetrics.entries()).map(([key, { label, data }]) => {
                        const values = players.map(p => {
                          const d = data.get(p.id);
                          return { val: d?.value, pct: d?.percentile ?? null };
                        });

                        const validPcts = values.filter(v => v.pct !== null).map(v => v.pct!);
                        const maxPct = validPcts.length > 0 ? Math.max(...validPcts) : null;

                        return (
                          <tr key={key} className="border-b border-zinc-800/30 hover:bg-zinc-800/30">
                            <td className="px-4 py-2 text-zinc-400">{label}</td>
                            {values.map((v, idx) => (
                              <td key={idx} className="px-4 py-2 text-right">
                                <span className={`font-mono ${v.pct === maxPct && maxPct !== null ? 'font-bold text-white' : 'text-zinc-300'}`}>
                                  {v.val !== undefined ? v.val : '—'}
                                </span>
                                {v.pct !== null ? (
                                  <span className={`text-xs ml-1.5 ${percentileTextColor(v.pct)}`}>
                                    p{v.pct}
                                  </span>
                                ) : (
                                  <span className="text-xs ml-1.5 text-zinc-600">—</span>
                                )}
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
          </div>
        )}
      </div>
    </div>
  );
}

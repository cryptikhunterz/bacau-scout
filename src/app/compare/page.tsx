'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

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

/* ------------------------------------------------------------------ */
/*  Player Search Autocomplete                                         */
/* ------------------------------------------------------------------ */

function PlayerSearch({
  label,
  onSelect,
  selectedPlayer,
  onClear,
  color,
}: {
  label: string;
  onSelect: (p: SearchResult) => void;
  selectedPlayer: PlayerDetail | null;
  onClear: () => void;
  color: 'blue' | 'red';
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const borderColor = color === 'blue' ? 'border-blue-500' : 'border-red-500';
  const ringColor = color === 'blue' ? 'focus:ring-blue-500' : 'focus:ring-red-500';
  const labelColor = color === 'blue' ? 'text-blue-400' : 'text-red-400';

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (selectedPlayer) {
    return (
      <div className={`border-2 ${borderColor} rounded-xl bg-zinc-900 p-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>{label}</span>
          <button
            onClick={onClear}
            className="text-zinc-500 hover:text-white text-sm transition-colors"
          >
            ✕ Change
          </button>
        </div>
        <div className="flex items-center gap-3">
          {selectedPlayer.photoUrl && (
            <img
              src={selectedPlayer.photoUrl}
              alt={selectedPlayer.name}
              className="w-12 h-12 rounded-full object-cover bg-zinc-800"
            />
          )}
          <div>
            <div className="font-bold text-white text-lg">{selectedPlayer.name}</div>
            <div className="text-sm text-zinc-400">
              {selectedPlayer.position} • {selectedPlayer.club || 'Unknown club'}
              {selectedPlayer.age ? ` • ${selectedPlayer.age}y` : ''}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <span className={`text-xs font-bold uppercase tracking-wider ${labelColor} mb-1 block`}>
        {label}
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search player name..."
        className={`w-full px-4 py-3 bg-zinc-900 border-2 ${borderColor} rounded-xl
                   text-white placeholder-zinc-500
                   focus:outline-none focus:ring-2 ${ringColor} transition-all`}
      />
      {loading && (
        <div className="absolute right-3 top-9 text-zinc-500 text-sm">...</div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.playerId}
              onClick={() => {
                onSelect(r);
                setQuery('');
                setResults([]);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-zinc-700 transition-colors flex justify-between items-center"
            >
              <div>
                <span className="text-white font-medium">{r.name}</span>
                <span className="text-zinc-500 text-sm ml-2">
                  {r.position || ''}
                </span>
              </div>
              <span className="text-zinc-500 text-sm">{r.club || ''}</span>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-4 text-center text-zinc-500">
          No players found
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Comparison Bar                                                     */
/* ------------------------------------------------------------------ */

function ComparisonBar({
  label,
  value1,
  value2,
  maxValue,
  isPercentage = false,
}: {
  label: string;
  value1: number;
  value2: number;
  maxValue: number;
  isPercentage?: boolean;
}) {
  const pct1 = maxValue > 0 ? Math.min((value1 / maxValue) * 100, 100) : 0;
  const pct2 = maxValue > 0 ? Math.min((value2 / maxValue) * 100, 100) : 0;

  const fmt = (v: number) =>
    isPercentage ? `${v.toFixed(1)}%` : v.toLocaleString();

  return (
    <div className="mb-3">
      <div className="text-center text-sm font-medium text-zinc-300 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        {/* Player 1 value */}
        <div className="w-16 text-right text-sm font-mono text-blue-400">{fmt(value1)}</div>
        {/* Player 1 bar (right-to-left) */}
        <div className="flex-1 h-6 bg-zinc-800 rounded-l overflow-hidden flex justify-end">
          <div
            className="h-full bg-blue-500 rounded-l transition-all duration-500"
            style={{ width: `${pct1}%` }}
          />
        </div>
        {/* Divider */}
        <div className="w-px h-6 bg-zinc-600" />
        {/* Player 2 bar (left-to-right) */}
        <div className="flex-1 h-6 bg-zinc-800 rounded-r overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-r transition-all duration-500"
            style={{ width: `${pct2}%` }}
          />
        </div>
        {/* Player 2 value */}
        <div className="w-16 text-left text-sm font-mono text-red-400">{fmt(value2)}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Season Stats Table                                                 */
/* ------------------------------------------------------------------ */

function SeasonComparison({
  player1,
  player2,
}: {
  player1: PlayerDetail;
  player2: PlayerDetail;
}) {
  // Find overlapping seasons
  const p1Seasons = new Map<string, { matches: number; goals: number; assists: number }>();
  const p2Seasons = new Map<string, { matches: number; goals: number; assists: number }>();

  for (const s of player1.stats) {
    const key = s.season;
    const existing = p1Seasons.get(key);
    if (existing) {
      existing.matches += s.matches;
      existing.goals += s.goals;
      existing.assists += s.assists;
    } else {
      p1Seasons.set(key, { matches: s.matches, goals: s.goals, assists: s.assists });
    }
  }

  for (const s of player2.stats) {
    const key = s.season;
    const existing = p2Seasons.get(key);
    if (existing) {
      existing.matches += s.matches;
      existing.goals += s.goals;
      existing.assists += s.assists;
    } else {
      p2Seasons.set(key, { matches: s.matches, goals: s.goals, assists: s.assists });
    }
  }

  // Get all seasons from both players, sorted descending
  const allSeasons = Array.from(new Set([...p1Seasons.keys(), ...p2Seasons.keys()])).sort(
    (a, b) => b.localeCompare(a)
  );

  if (allSeasons.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-4">
        No season data available
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">Season-by-Season Comparison</h3>
      {allSeasons.map((season) => {
        const s1 = p1Seasons.get(season) || { matches: 0, goals: 0, assists: 0 };
        const s2 = p2Seasons.get(season) || { matches: 0, goals: 0, assists: 0 };
        const maxMatches = Math.max(s1.matches, s2.matches, 1);
        const maxGoals = Math.max(s1.goals, s2.goals, 1);
        const maxAssists = Math.max(s1.assists, s2.assists, 1);

        return (
          <div key={season} className="mb-6">
            <div className="text-sm font-bold text-zinc-400 mb-2 text-center border-b border-zinc-800 pb-1">
              {season}
            </div>
            <ComparisonBar
              label="Appearances"
              value1={s1.matches}
              value2={s2.matches}
              maxValue={maxMatches}
            />
            <ComparisonBar
              label="Goals"
              value1={s1.goals}
              value2={s2.goals}
              maxValue={maxGoals}
            />
            <ComparisonBar
              label="Assists"
              value1={s1.assists}
              value2={s2.assists}
              maxValue={maxAssists}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ComparePage() {
  const [player1, setPlayer1] = useState<PlayerDetail | null>(null);
  const [player2, setPlayer2] = useState<PlayerDetail | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const loadPlayer = async (
    playerId: string,
    setter: (p: PlayerDetail) => void,
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/players/${playerId}`);
      if (res.ok) {
        const data = await res.json();
        setter(data);
      }
    } catch (err) {
      console.error('Failed to load player:', err);
    } finally {
      setLoading(false);
    }
  };

  // Career stat maxima for the bars (use the higher value so bars are relative)
  const career1 = player1?.careerTotals;
  const career2 = player2?.careerTotals;

  const maxApps = Math.max(career1?.matches || 0, career2?.matches || 0, 1);
  const maxGoals = Math.max(career1?.goals || 0, career2?.goals || 0, 1);
  const maxAssists = Math.max(career1?.assists || 0, career2?.assists || 0, 1);
  const maxMinutes = Math.max(career1?.minutes || 0, career2?.minutes || 0, 1);

  // Per-90 stats
  const goalsP90_1 =
    career1 && career1.minutes > 0 ? (career1.goals / career1.minutes) * 90 : 0;
  const goalsP90_2 =
    career2 && career2.minutes > 0 ? (career2.goals / career2.minutes) * 90 : 0;
  const assistsP90_1 =
    career1 && career1.minutes > 0 ? (career1.assists / career1.minutes) * 90 : 0;
  const assistsP90_2 =
    career2 && career2.minutes > 0 ? (career2.assists / career2.minutes) * 90 : 0;

  const maxGP90 = Math.max(goalsP90_1, goalsP90_2, 0.01);
  const maxAP90 = Math.max(assistsP90_1, assistsP90_2, 0.01);

  // Goal involvement %
  const gi1 =
    career1 && career1.matches > 0
      ? ((career1.goals + career1.assists) / career1.matches) * 100
      : 0;
  const gi2 =
    career2 && career2.matches > 0
      ? ((career2.goals + career2.assists) / career2.matches) * 100
      : 0;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Player Comparison</h1>
            <p className="text-sm text-zinc-500">Compare two players side by side</p>
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
        {/* Player Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlayerSearch
            label="Player 1"
            color="blue"
            selectedPlayer={player1}
            onSelect={(r) => loadPlayer(r.playerId, setPlayer1, setLoading1)}
            onClear={() => setPlayer1(null)}
          />
          <PlayerSearch
            label="Player 2"
            color="red"
            selectedPlayer={player2}
            onSelect={(r) => loadPlayer(r.playerId, setPlayer2, setLoading2)}
            onClear={() => setPlayer2(null)}
          />
        </div>

        {/* Loading */}
        {(loading1 || loading2) && (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Comparison */}
        {player1 && player2 && !loading1 && !loading2 && (
          <div className="space-y-6">
            {/* Player Headers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                {player1.photoUrl && (
                  <img
                    src={player1.photoUrl}
                    alt={player1.name}
                    className="w-20 h-20 rounded-full mx-auto mb-2 object-cover bg-zinc-800"
                  />
                )}
                <div className="font-bold text-white text-lg">{player1.name}</div>
                <div className="text-sm text-zinc-400">{player1.position}</div>
                <div className="text-sm text-zinc-500">
                  {player1.club} • {player1.age}y
                </div>
                {player1.marketValue && (
                  <div className="text-green-400 text-sm font-medium mt-1">
                    {player1.marketValue}
                  </div>
                )}
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                {player2.photoUrl && (
                  <img
                    src={player2.photoUrl}
                    alt={player2.name}
                    className="w-20 h-20 rounded-full mx-auto mb-2 object-cover bg-zinc-800"
                  />
                )}
                <div className="font-bold text-white text-lg">{player2.name}</div>
                <div className="text-sm text-zinc-400">{player2.position}</div>
                <div className="text-sm text-zinc-500">
                  {player2.club} • {player2.age}y
                </div>
                {player2.marketValue && (
                  <div className="text-green-400 text-sm font-medium mt-1">
                    {player2.marketValue}
                  </div>
                )}
              </div>
            </div>

            {/* Career Totals */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Career Totals</h3>
              <ComparisonBar
                label="Appearances"
                value1={career1?.matches || 0}
                value2={career2?.matches || 0}
                maxValue={maxApps}
              />
              <ComparisonBar
                label="Goals"
                value1={career1?.goals || 0}
                value2={career2?.goals || 0}
                maxValue={maxGoals}
              />
              <ComparisonBar
                label="Assists"
                value1={career1?.assists || 0}
                value2={career2?.assists || 0}
                maxValue={maxAssists}
              />
              <ComparisonBar
                label="Minutes"
                value1={career1?.minutes || 0}
                value2={career2?.minutes || 0}
                maxValue={maxMinutes}
              />
            </div>

            {/* Per-90 & Ratios */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Per-90 & Ratios</h3>
              <ComparisonBar
                label="Goals per 90"
                value1={goalsP90_1}
                value2={goalsP90_2}
                maxValue={maxGP90}
              />
              <ComparisonBar
                label="Assists per 90"
                value1={assistsP90_1}
                value2={assistsP90_2}
                maxValue={maxAP90}
              />
              <ComparisonBar
                label="G+A per Match (%)"
                value1={gi1}
                value2={gi2}
                maxValue={100}
                isPercentage
              />
            </div>

            {/* Season by Season */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <SeasonComparison player1={player1} player2={player2} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!player1 && !player2 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">⚽ vs ⚽</div>
            <h2 className="text-xl font-bold text-zinc-400 mb-2">
              Select two players to compare
            </h2>
            <p className="text-zinc-600">
              Use the search boxes above to find and select players from the database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

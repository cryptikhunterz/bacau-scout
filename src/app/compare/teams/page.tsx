'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

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

/* ------------------------------------------------------------------ */
/*  Team Search Autocomplete                                           */
/* ------------------------------------------------------------------ */

function TeamSearch({
  label,
  onSelect,
  selectedTeam,
  onClear,
  color,
}: {
  label: string;
  onSelect: (club: string) => void;
  selectedTeam: TeamData | null;
  onClear: () => void;
  color: 'blue' | 'red';
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
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

  if (selectedTeam) {
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
        <div>
          <div className="font-bold text-white text-lg">{selectedTeam.club}</div>
          <div className="text-sm text-zinc-400">
            {selectedTeam.league || 'Unknown league'} • {selectedTeam.squadSize} players
          </div>
          <div className="text-green-400 text-sm font-medium mt-1">
            {selectedTeam.totalMarketValueFormatted}
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
        placeholder="Search team/club name..."
        className={`w-full px-4 py-3 bg-zinc-900 border-2 ${borderColor} rounded-xl
                   text-white placeholder-zinc-500
                   focus:outline-none focus:ring-2 ${ringColor} transition-all`}
      />
      {loading && (
        <div className="absolute right-3 top-9 text-zinc-500 text-sm">...</div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {results.map((club) => (
            <button
              key={club}
              onClick={() => {
                onSelect(club);
                setQuery('');
                setResults([]);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-zinc-700 transition-colors"
            >
              <span className="text-white font-medium">{club}</span>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-4 text-center text-zinc-500">
          No teams found
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Comparison Bar (same as player comparison)                         */
/* ------------------------------------------------------------------ */

function ComparisonBar({
  label,
  value1,
  value2,
  maxValue,
  format = 'number',
}: {
  label: string;
  value1: number;
  value2: number;
  maxValue: number;
  format?: 'number' | 'decimal' | 'currency' | 'percentage';
}) {
  const pct1 = maxValue > 0 ? Math.min((value1 / maxValue) * 100, 100) : 0;
  const pct2 = maxValue > 0 ? Math.min((value2 / maxValue) * 100, 100) : 0;

  const fmt = (v: number) => {
    switch (format) {
      case 'decimal':
        return v.toFixed(1);
      case 'currency':
        if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
        return v > 0 ? `€${v}` : '-';
      case 'percentage':
        return `${v.toFixed(1)}%`;
      default:
        return v.toLocaleString();
    }
  };

  return (
    <div className="mb-3">
      <div className="text-center text-sm font-medium text-zinc-300 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className="w-20 text-right text-sm font-mono text-blue-400">{fmt(value1)}</div>
        <div className="flex-1 h-6 bg-zinc-800 rounded-l overflow-hidden flex justify-end">
          <div
            className="h-full bg-blue-500 rounded-l transition-all duration-500"
            style={{ width: `${pct1}%` }}
          />
        </div>
        <div className="w-px h-6 bg-zinc-600" />
        <div className="flex-1 h-6 bg-zinc-800 rounded-r overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-r transition-all duration-500"
            style={{ width: `${pct2}%` }}
          />
        </div>
        <div className="w-20 text-left text-sm font-mono text-red-400">{fmt(value2)}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Position Breakdown Bar                                             */
/* ------------------------------------------------------------------ */

function PositionBar({
  label,
  value1,
  value2,
  maxValue,
}: {
  label: string;
  value1: number;
  value2: number;
  maxValue: number;
}) {
  const pct1 = maxValue > 0 ? Math.min((value1 / maxValue) * 100, 100) : 0;
  const pct2 = maxValue > 0 ? Math.min((value2 / maxValue) * 100, 100) : 0;

  return (
    <div className="mb-2">
      <div className="text-center text-sm font-medium text-zinc-300 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className="w-10 text-right text-sm font-mono text-blue-400">{value1}</div>
        <div className="flex-1 h-5 bg-zinc-800 rounded-l overflow-hidden flex justify-end">
          <div
            className="h-full bg-blue-500/70 rounded-l transition-all duration-500"
            style={{ width: `${pct1}%` }}
          />
        </div>
        <div className="w-px h-5 bg-zinc-600" />
        <div className="flex-1 h-5 bg-zinc-800 rounded-r overflow-hidden">
          <div
            className="h-full bg-red-500/70 rounded-r transition-all duration-500"
            style={{ width: `${pct2}%` }}
          />
        </div>
        <div className="w-10 text-left text-sm font-mono text-red-400">{value2}</div>
      </div>
    </div>
  );
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
  color: 'blue' | 'red';
}) {
  const borderColor = color === 'blue' ? 'border-blue-500/30' : 'border-red-500/30';
  const headerBg = color === 'blue' ? 'bg-blue-500/10' : 'bg-red-500/10';
  const headerText = color === 'blue' ? 'text-blue-400' : 'text-red-400';

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
  const [team1, setTeam1] = useState<TeamData | null>(null);
  const [team2, setTeam2] = useState<TeamData | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const loadTeam = async (
    club: string,
    setter: (t: TeamData) => void,
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${encodeURIComponent(club)}`);
      if (res.ok) {
        const data = await res.json();
        setter(data);
      }
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute bar maxima
  const maxSquad = Math.max(team1?.squadSize || 0, team2?.squadSize || 0, 1);
  const maxAge = Math.max(team1?.avgAge || 0, team2?.avgAge || 0, 1);
  const maxAvgVal = Math.max(team1?.avgMarketValue || 0, team2?.avgMarketValue || 0, 1);
  const maxTotalVal = Math.max(team1?.totalMarketValue || 0, team2?.totalMarketValue || 0, 1);
  const maxApps = Math.max(team1?.totalAppearances || 0, team2?.totalAppearances || 0, 1);
  const maxGoals = Math.max(team1?.totalGoals || 0, team2?.totalGoals || 0, 1);
  const maxAssists = Math.max(team1?.totalAssists || 0, team2?.totalAssists || 0, 1);

  // Position breakdown max
  const maxPos = Math.max(
    team1?.positionBreakdown.GK || 0,
    team1?.positionBreakdown.DEF || 0,
    team1?.positionBreakdown.MID || 0,
    team1?.positionBreakdown.FWD || 0,
    team2?.positionBreakdown.GK || 0,
    team2?.positionBreakdown.DEF || 0,
    team2?.positionBreakdown.MID || 0,
    team2?.positionBreakdown.FWD || 0,
    1
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Team Comparison</h1>
            <p className="text-sm text-zinc-500">Compare two clubs side by side</p>
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
        {/* Team Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TeamSearch
            label="Team 1"
            color="blue"
            selectedTeam={team1}
            onSelect={(club) => loadTeam(club, setTeam1, setLoading1)}
            onClear={() => setTeam1(null)}
          />
          <TeamSearch
            label="Team 2"
            color="red"
            selectedTeam={team2}
            onSelect={(club) => loadTeam(club, setTeam2, setLoading2)}
            onClear={() => setTeam2(null)}
          />
        </div>

        {/* Loading */}
        {(loading1 || loading2) && (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Comparison */}
        {team1 && team2 && !loading1 && !loading2 && (
          <div className="space-y-6">
            {/* Team Headers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="font-bold text-white text-lg">{team1.club}</div>
                <div className="text-sm text-zinc-400">{team1.league || 'Unknown league'}</div>
                <div className="text-sm text-zinc-500">{team1.squadSize} players</div>
                <div className="text-green-400 text-sm font-medium mt-1">
                  {team1.totalMarketValueFormatted}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="font-bold text-white text-lg">{team2.club}</div>
                <div className="text-sm text-zinc-400">{team2.league || 'Unknown league'}</div>
                <div className="text-sm text-zinc-500">{team2.squadSize} players</div>
                <div className="text-green-400 text-sm font-medium mt-1">
                  {team2.totalMarketValueFormatted}
                </div>
              </div>
            </div>

            {/* Squad Overview */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Squad Overview</h3>
              <ComparisonBar
                label="Squad Size"
                value1={team1.squadSize}
                value2={team2.squadSize}
                maxValue={maxSquad}
              />
              <ComparisonBar
                label="Average Age"
                value1={team1.avgAge}
                value2={team2.avgAge}
                maxValue={maxAge}
                format="decimal"
              />
              <ComparisonBar
                label="Avg Market Value"
                value1={team1.avgMarketValue}
                value2={team2.avgMarketValue}
                maxValue={maxAvgVal}
                format="currency"
              />
              <ComparisonBar
                label="Total Market Value"
                value1={team1.totalMarketValue}
                value2={team2.totalMarketValue}
                maxValue={maxTotalVal}
                format="currency"
              />
            </div>

            {/* Position Breakdown */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Position Breakdown</h3>
              <PositionBar
                label="🧤 Goalkeepers"
                value1={team1.positionBreakdown.GK}
                value2={team2.positionBreakdown.GK}
                maxValue={maxPos}
              />
              <PositionBar
                label="🛡️ Defenders"
                value1={team1.positionBreakdown.DEF}
                value2={team2.positionBreakdown.DEF}
                maxValue={maxPos}
              />
              <PositionBar
                label="⚙️ Midfielders"
                value1={team1.positionBreakdown.MID}
                value2={team2.positionBreakdown.MID}
                maxValue={maxPos}
              />
              <PositionBar
                label="⚽ Forwards"
                value1={team1.positionBreakdown.FWD}
                value2={team2.positionBreakdown.FWD}
                maxValue={maxPos}
              />
            </div>

            {/* Squad Performance */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Squad Performance</h3>
              <ComparisonBar
                label="Total Appearances"
                value1={team1.totalAppearances}
                value2={team2.totalAppearances}
                maxValue={maxApps}
              />
              <ComparisonBar
                label="Total Goals"
                value1={team1.totalGoals}
                value2={team2.totalGoals}
                maxValue={maxGoals}
              />
              <ComparisonBar
                label="Total Assists"
                value1={team1.totalAssists}
                value2={team2.totalAssists}
                maxValue={maxAssists}
              />
            </div>

            {/* Squad Lists */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Full Squads</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SquadList team={team1} color="blue" />
                <SquadList team={team2} color="red" />
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!team1 && !team2 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🏟️ vs 🏟️</div>
            <h2 className="text-xl font-bold text-zinc-400 mb-2">
              Select two teams to compare
            </h2>
            <p className="text-zinc-600">
              Use the search boxes above to find clubs from the player database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

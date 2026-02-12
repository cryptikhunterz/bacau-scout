'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PlayerAvatar } from '@/components/PlayerAvatar';

interface Player {
  name: string;
  position: string | null;
  age: number | null;
  club: string | null;
  league: string | null;
  market_value: string | null;
  nationality: string | string[];
  player_id: string | null;
  appearances: number | null;
  goals: number | null;
  assists: number | null;
  photo_url: string | null;
}

// FM-style stat badge
function StatBadge({ value, type = 'stat' }: { value: number | string | null; type?: 'stat' | 'age' | 'value' }) {
  if (value === null || value === undefined || value === '-') {
    return <span className="text-zinc-600">-</span>;
  }
  
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
  
  let color = 'bg-zinc-700 text-zinc-300';
  if (type === 'stat') {
    // Goals/assists style - higher is better
    if (num >= 15) color = 'bg-green-500 text-white';
    else if (num >= 10) color = 'bg-green-600 text-white';
    else if (num >= 5) color = 'bg-yellow-500 text-black';
    else if (num >= 1) color = 'bg-zinc-600 text-white';
  } else if (type === 'age') {
    // Age - young is green, old is red
    if (num <= 21) color = 'bg-green-500 text-white';
    else if (num <= 25) color = 'bg-green-600 text-white';
    else if (num <= 28) color = 'bg-yellow-500 text-black';
    else if (num <= 32) color = 'bg-orange-500 text-white';
    else color = 'bg-red-600 text-white';
  }
  
  return (
    <span className={`inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded font-bold text-xs ${color}`}>
      {value}
    </span>
  );
}

// Position badge colors
const positionColors: Record<string, string> = {
  'Goalkeeper': 'bg-yellow-600',
  'Centre-Back': 'bg-blue-600',
  'Left-Back': 'bg-blue-500',
  'Right-Back': 'bg-blue-500',
  'Defensive Midfield': 'bg-green-700',
  'Central Midfield': 'bg-green-600',
  'Attacking Midfield': 'bg-green-500',
  'Midfield': 'bg-green-600',
  'Left Winger': 'bg-purple-600',
  'Right Winger': 'bg-purple-600',
  'Centre-Forward': 'bg-red-600',
  'Attack': 'bg-red-600',
};

function getPositionColor(position: string | null): string {
  if (!position) return 'bg-zinc-600';
  for (const [key, color] of Object.entries(positionColors)) {
    if (position.includes(key)) return color;
  }
  return 'bg-zinc-600';
}

function getPositionAbbrev(position: string | null): string {
  if (!position) return '?';
  const abbrevMap: Record<string, string> = {
    'Goalkeeper': 'GK', 'Centre-Back': 'CB', 'Left-Back': 'LB', 'Right-Back': 'RB',
    'Defensive Midfield': 'DM', 'Central Midfield': 'CM', 'Attacking Midfield': 'AM',
    'Left Winger': 'LW', 'Right Winger': 'RW', 'Centre-Forward': 'CF',
  };
  for (const [key, abbrev] of Object.entries(abbrevMap)) {
    if (position.includes(key)) return abbrev;
  }
  return position.substring(0, 2).toUpperCase();
}

function parseValue(val: string | null): number {
  if (!val) return 0;
  const cleaned = val.replace(/[€,]/g, '').toUpperCase();
  const match = cleaned.match(/([\d.]+)(K|M)?/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  if (match[2] === 'M') return num * 1000000;
  if (match[2] === 'K') return num * 1000;
  return num;
}

export default function SearchPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'value' | 'goals' | 'matches'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const perPage = 50;

  useEffect(() => {
    async function loadPlayers() {
      try {
        const res = await fetch('/players.json');
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error('Failed to load players:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlayers();
  }, []);

  const positions = useMemo(() => {
    const set = new Set<string>();
    players.forEach(p => { if (p.position) set.add(p.position); });
    return Array.from(set).sort();
  }, [players]);

  const leagues = useMemo(() => {
    const set = new Set<string>();
    players.forEach(p => { if (p.league) set.add(p.league); });
    return Array.from(set).sort();
  }, [players]);

  const filteredPlayers = useMemo(() => {
    // Pre-compute URL player ID extraction once (not per player)
    let urlPlayerId: string | null = null;
    let searchLower = '';
    if (search) {
      if (search.includes('transfermarkt') && search.includes('spieler')) {
        const match = search.match(/spieler\/(\d+)/);
        urlPlayerId = match ? match[1] : null;
      } else {
        searchLower = search.toLowerCase();
      }
    }

    let result = players.filter(p => {
      if (search) {
        if (urlPlayerId !== null) {
          return p.player_id === urlPlayerId;
        }
        if (urlPlayerId === null && search.includes('transfermarkt')) {
          return false; // URL-like but no valid player ID
        }
        // Regular name search
        if (!p.name.toLowerCase().includes(searchLower)) return false;
      }
      if (positionFilter && p.position !== positionFilter) return false;
      if (leagueFilter && p.league !== leagueFilter) return false;
      if (minAge && p.age && p.age < parseInt(minAge)) return false;
      if (maxAge && p.age && p.age > parseInt(maxAge)) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'age': cmp = (a.age || 0) - (b.age || 0); break;
        case 'value': cmp = parseValue(a.market_value) - parseValue(b.market_value); break;
        case 'goals': cmp = (a.goals || 0) - (b.goals || 0); break;
        case 'matches': cmp = (a.appearances || 0) - (b.appearances || 0); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [players, search, positionFilter, leagueFilter, minAge, maxAge, sortBy, sortDir]);

  const totalPages = Math.ceil(filteredPlayers.length / perPage);
  const paginatedPlayers = filteredPlayers.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, positionFilter, leagueFilter, minAge, maxAge]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <span className="text-zinc-500 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="bg-zinc-800 border-b border-zinc-700 py-4 px-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              ← Back to Reports
            </Link>
            <Link href="/compare" className="text-zinc-400 hover:text-white transition-colors text-sm">
              ⚖️ Compare
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Player Database</h1>
              <p className="text-sm text-zinc-400">{filteredPlayers.length.toLocaleString()} players</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players..."
              className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg
                         text-white placeholder-zinc-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="text-sm text-zinc-400">{players.length.toLocaleString()} players • {leagues.length} leagues</div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-zinc-800/50 border-b border-zinc-700 py-3 px-4">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center gap-4">
          <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-white">
            <option value="">All Positions</option>
            {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>

          <select value={leagueFilter} onChange={(e) => setLeagueFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-white">
            <option value="">All Leagues</option>
            {leagues.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Age:</span>
            <input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} placeholder="Min"
              className="w-16 px-2 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-white" />
            <span className="text-zinc-500">-</span>
            <input type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} placeholder="Max"
              className="w-16 px-2 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-white" />
          </div>

          {(positionFilter || leagueFilter || minAge || maxAge || search) && (
            <button onClick={() => { setPositionFilter(''); setLeagueFilter(''); setMinAge(''); setMaxAge(''); setSearch(''); }}
              className="px-3 py-2 text-sm text-red-400 hover:text-red-300">Clear Filters</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1800px] mx-auto p-4">
        <div className="bg-zinc-800 rounded-lg shadow-xl overflow-hidden border border-zinc-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="px-3 py-3 text-left font-medium text-zinc-400">POS</th>
                  <th className="px-3 py-3 text-left font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                    Name <SortIcon col="name" />
                  </th>
                  <th className="px-3 py-3 text-center font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('age')}>
                    Age <SortIcon col="age" />
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-zinc-400">Club</th>
                  <th className="px-3 py-3 text-left font-medium text-zinc-400">League</th>
                  <th className="px-3 py-3 text-right font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('value')}>
                    Value <SortIcon col="value" />
                  </th>
                  <th className="px-3 py-3 text-center font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('matches')}>
                    MP <SortIcon col="matches" />
                  </th>
                  <th className="px-3 py-3 text-center font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('goals')}>
                    Gls <SortIcon col="goals" />
                  </th>
                  <th className="px-3 py-3 text-center font-medium text-zinc-400">Ast</th>
                  <th className="px-3 py-3 text-center font-medium text-zinc-400">G+A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50">
                {paginatedPlayers.map((player, idx) => (
                  <tr key={`${player.player_id}-${idx}`} className="hover:bg-zinc-700/30 transition-colors">
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-1 text-xs font-bold text-white rounded ${getPositionColor(player.position)}`}>
                        {getPositionAbbrev(player.position)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/player/${player.player_id}`} className="flex items-center gap-2 font-medium text-white hover:text-blue-400 transition-colors">
                        <PlayerAvatar
                          photoUrl={player.photo_url}
                          name={player.name}
                          size="w-8 h-8"
                          rounded="rounded-full"
                          fallbackBg="bg-zinc-700"
                          fallbackTextSize="text-xs"
                        />
                        {player.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatBadge value={player.age} type="age" />
                    </td>
                    <td className="px-3 py-2 text-zinc-300">{player.club || '-'}</td>
                    <td className="px-3 py-2 text-zinc-500 text-xs">{player.league || '-'}</td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-green-400 font-medium">{player.market_value || '-'}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatBadge value={player.appearances} type="stat" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatBadge value={player.goals} type="stat" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatBadge value={player.assists} type="stat" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatBadge value={(player.goals || 0) + (player.assists || 0)} type="stat" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-t border-zinc-700">
            <div className="text-sm text-zinc-400">
              Showing {((page - 1) * perPage) + 1} - {Math.min(page * perPage, filteredPlayers.length)} of {filteredPlayers.length.toLocaleString()}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 bg-zinc-700 border border-zinc-600 rounded text-sm text-white disabled:opacity-50 hover:bg-zinc-600">
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-zinc-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 bg-zinc-700 border border-zinc-600 rounded text-sm text-white disabled:opacity-50 hover:bg-zinc-600">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

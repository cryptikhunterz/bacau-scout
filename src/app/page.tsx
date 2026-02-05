'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getAllGradesAsync, PlayerGrade, getPotentialColor } from '@/lib/grades';

// Position badge colors
const positionColors: Record<string, string> = {
  'Goalkeeper': 'bg-yellow-600',
  'Defender': 'bg-blue-600',
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

function getPositionColor(position: string): string {
  for (const [key, color] of Object.entries(positionColors)) {
    if (position.includes(key)) return color;
  }
  return 'bg-zinc-600';
}

function getPositionAbbrev(position: string): string {
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

// Direct ability and potential from grade (both 1-8, set by scout)
function getAbility(g: PlayerGrade): number { return g.ability || 4; }
function getPotential(g: PlayerGrade): number { return g.potential || 4; }

// Verdict badge
function VerdictBadge({ verdict }: { verdict: string }) {
  const colors: Record<string, string> = {
    'Sign': 'bg-green-600 text-white',
    'Observe': 'bg-blue-600 text-white',
    'Monitor': 'bg-yellow-500 text-black',
    'Not a priority': 'bg-zinc-600 text-white',
    'Out of reach': 'bg-red-600 text-white',
    'Discard': 'bg-red-800 text-white',
  };
  return (
    <span className={`inline-block px-2 py-1 text-xs font-bold rounded whitespace-nowrap ${colors[verdict] || 'bg-zinc-600 text-white'}`}>
      {verdict}
    </span>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [grades, setGrades] = useState<PlayerGrade[]>([]);
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('');
  const [posFilter, setPosFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'ability' | 'potential' | 'date'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    getAllGradesAsync().then(setGrades);
  }, []);

  const filteredGrades = useMemo(() => {
    let result = grades.filter(g => {
      if (search && !g.playerName.toLowerCase().includes(search.toLowerCase())) return false;
      if (verdictFilter && g.verdict !== verdictFilter) return false;
      if (posFilter && !g.position.toLowerCase().includes(posFilter.toLowerCase())) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.playerName.localeCompare(b.playerName); break;
        case 'ability': cmp = getAbility(a) - getAbility(b); break;
        case 'potential': cmp = getPotential(a) - getPotential(b); break;
        case 'date': cmp = new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [grades, search, verdictFilter, posFilter, sortBy, sortDir]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <span className="text-zinc-500 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const signCount = grades.filter(g => g.verdict === 'Sign').length;
  const observeCount = grades.filter(g => g.verdict === 'Observe').length;
  const monitorCount = grades.filter(g => g.verdict === 'Monitor').length;
  const notPriorityCount = grades.filter(g => g.verdict === 'Not a priority').length;
  const outOfReachCount = grades.filter(g => g.verdict === 'Out of reach').length;
  const discardCount = grades.filter(g => g.verdict === 'Discard').length;

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="bg-zinc-800 border-b border-zinc-700 py-4 px-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Bacau Scout</h1>
            <p className="text-sm text-zinc-400 flex flex-wrap gap-x-1">
              <span>{grades.length} scouting reports •</span>
              <span className="text-green-400">{signCount} Sign</span><span>•</span>
              <span className="text-blue-400">{observeCount} Observe</span><span>•</span>
              <span className="text-yellow-400">{monitorCount} Monitor</span><span>•</span>
              <span className="text-zinc-400">{notPriorityCount} Not a priority</span><span>•</span>
              <span className="text-red-400">{outOfReachCount} Out of reach</span><span>•</span>
              <span className="text-red-600">{discardCount} Discard</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {session?.user?.role === 'admin' && (
              <Link href="/admin"
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors text-sm">
                ⚙️ Admin
              </Link>
            )}
            <Link href="/search"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              + Scout New Player
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-zinc-800/50 border-b border-zinc-700 py-3 px-4">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center gap-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-white placeholder-zinc-400 w-64" />

          <select value={verdictFilter} onChange={(e) => setVerdictFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-white">
            <option value="">All Verdicts</option>
            <option value="Sign">Sign</option>
            <option value="Observe">Observe</option>
            <option value="Monitor">Monitor</option>
            <option value="Not a priority">Not a priority</option>
            <option value="Out of reach">Out of reach</option>
            <option value="Discard">Discard</option>
          </select>

          <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-white">
            <option value="">All Positions</option>
            <option value="Goalkeeper">Goalkeeper</option>
            <option value="Back">Defenders</option>
            <option value="Midfield">Midfielders</option>
            <option value="Wing">Wingers</option>
            <option value="Forward">Forwards</option>
          </select>

          {(search || verdictFilter || posFilter) && (
            <button onClick={() => { setSearch(''); setVerdictFilter(''); setPosFilter(''); }}
              className="text-sm text-red-400 hover:text-red-300">Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1800px] mx-auto p-4">
        {grades.length === 0 ? (
          <div className="bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 p-12 text-center">
            <p className="text-zinc-400 mb-4">No scouting reports yet</p>
            <Link href="/search"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Start Scouting
            </Link>
          </div>
        ) : (
          <div className="bg-zinc-800 rounded-lg shadow-xl overflow-hidden border border-zinc-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium text-zinc-400">POS</th>
                    <th className="px-3 py-3 text-left font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                      Player <SortIcon col="name" />
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-zinc-400">Club</th>
                    <th className="px-3 py-3 text-center font-medium text-zinc-400">Verdict</th>
                    <th className="px-3 py-3 text-center font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('ability')}>
                      Ability <SortIcon col="ability" />
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('potential')}>
                      Potential <SortIcon col="potential" />
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-zinc-400">Est Salary</th>
                    <th className="px-3 py-3 text-left font-medium text-zinc-400">Scout</th>
                    <th className="px-3 py-3 text-left font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
                      Date <SortIcon col="date" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700/50">
                  {filteredGrades.map((grade) => (
                    <tr key={grade.playerId} className="hover:bg-zinc-700/30 transition-colors">
                      <td className="px-3 py-2">
                        <span className={`inline-block px-2 py-1 text-xs font-bold text-white rounded ${getPositionColor(grade.position)}`}>
                          {getPositionAbbrev(grade.position)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/player/${grade.playerId}`} className="font-medium text-white hover:text-blue-400">
                          {grade.playerName}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-zinc-400 text-xs">{grade.club}</td>
                      <td className="px-3 py-2 text-center"><VerdictBadge verdict={grade.verdict} /></td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center justify-center w-9 h-7 rounded font-bold text-sm ${getPotentialColor(getAbility(grade))}`}>
                          {getAbility(grade)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center justify-center w-9 h-7 rounded font-bold text-sm ${getPotentialColor(getPotential(grade))}`}>
                          {getPotential(grade)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-zinc-400 text-xs">{grade.salary || '-'}</td>
                      <td className="px-3 py-2 text-zinc-400 text-xs">{grade.scoutName || '-'}</td>
                      <td className="px-3 py-2 text-zinc-500 text-xs">{new Date(grade.gradedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredGrades.length === 0 && (
              <div className="p-8 text-center text-zinc-500">No reports match your filters</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

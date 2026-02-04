'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getAllGrades, PlayerGrade } from '@/lib/grades';

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

// Calculate category averages from grades
function getTechnicalAvg(g: PlayerGrade): number {
  return Math.round(((g.dribblingBallControl || 4) + (g.oneVsOneDribbling || 4) + (g.passingRangeCreation || 4) + (g.crossingDelivery || 4)) / 4 * 10) / 10;
}

function getAthleticAvg(g: PlayerGrade): number {
  return Math.round(((g.accelerationPace || 4) + (g.workRateStamina || 4) + (g.physicalDuelingAerial || 4)) / 3 * 10) / 10;
}

function getAttackingAvg(g: PlayerGrade): number {
  return Math.round(((g.goalContribution || 4) + (g.carryingProgression || 4) + (g.finishingShotPlacement || 4)) / 3 * 10) / 10;
}

function getTacticalAvg(g: PlayerGrade): number {
  return Math.round(((g.positionalIntelligence || 4) + (g.defensivePressingIntensity || 4) + (g.oneVsOneDuels || 4)) / 3 * 10) / 10;
}

function getOverallAvg(g: PlayerGrade): number {
  return Math.round((getTechnicalAvg(g) + getAthleticAvg(g) + getAttackingAvg(g) + getTacticalAvg(g)) / 4 * 10) / 10;
}

// FM-style rating badge (1-8 scale)
function RatingBadge({ value }: { value: number }) {
  let color = 'bg-zinc-700 text-zinc-300';
  if (value >= 7) color = 'bg-green-500 text-white';
  else if (value >= 5) color = 'bg-yellow-500 text-black';
  else if (value >= 3) color = 'bg-orange-500 text-white';
  else color = 'bg-red-600 text-white';
  
  return (
    <span className={`inline-flex items-center justify-center w-9 h-7 rounded font-bold text-sm ${color}`}>
      {value.toFixed(1)}
    </span>
  );
}

// Recommendation badge
function RecBadge({ rec }: { rec: string }) {
  const colors: Record<string, string> = {
    'Sign': 'bg-green-600 text-white',
    'Monitor': 'bg-yellow-500 text-black',
    'Discard': 'bg-red-600 text-white',
  };
  return (
    <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${colors[rec] || 'bg-zinc-600 text-white'}`}>
      {rec}
    </span>
  );
}

// Tags display
function TagsList({ tags, color }: { tags: string[]; color: 'green' | 'red' }) {
  if (!tags || tags.length === 0) return <span className="text-zinc-600">-</span>;
  const bgColor = color === 'green' ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-red-900/50 text-red-400 border border-red-700';
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map(tag => (
        <span key={tag} className={`inline-block px-1.5 py-0.5 text-[10px] rounded ${bgColor}`}>
          {tag}
        </span>
      ))}
      {tags.length > 3 && <span className="text-[10px] text-zinc-500">+{tags.length - 3}</span>}
    </div>
  );
}

export default function Home() {
  const [grades, setGrades] = useState<PlayerGrade[]>([]);
  const [search, setSearch] = useState('');
  const [recFilter, setRecFilter] = useState('');
  const [posFilter, setPosFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'overall' | 'technical' | 'athletic' | 'attacking' | 'tactical' | 'date'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setGrades(getAllGrades());
    const handleStorage = () => setGrades(getAllGrades());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const filteredGrades = useMemo(() => {
    let result = grades.filter(g => {
      if (search && !g.playerName.toLowerCase().includes(search.toLowerCase())) return false;
      if (recFilter && g.recommendation !== recFilter) return false;
      if (posFilter && !g.position.toLowerCase().includes(posFilter.toLowerCase())) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.playerName.localeCompare(b.playerName); break;
        case 'overall': cmp = getOverallAvg(a) - getOverallAvg(b); break;
        case 'technical': cmp = getTechnicalAvg(a) - getTechnicalAvg(b); break;
        case 'athletic': cmp = getAthleticAvg(a) - getAthleticAvg(b); break;
        case 'attacking': cmp = getAttackingAvg(a) - getAttackingAvg(b); break;
        case 'tactical': cmp = getTacticalAvg(a) - getTacticalAvg(b); break;
        case 'date': cmp = new Date(a.gradedAt).getTime() - new Date(b.gradedAt).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [grades, search, recFilter, posFilter, sortBy, sortDir]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <span className="text-zinc-500 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const signCount = grades.filter(g => g.recommendation === 'Sign').length;
  const monitorCount = grades.filter(g => g.recommendation === 'Monitor').length;
  const discardCount = grades.filter(g => g.recommendation === 'Discard').length;

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="bg-zinc-800 border-b border-zinc-700 py-4 px-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Bacau Scout</h1>
            <p className="text-sm text-zinc-400">
              {grades.length} scouting reports • 
              <span className="text-green-400 ml-2">{signCount} Sign</span> • 
              <span className="text-yellow-400 ml-2">{monitorCount} Monitor</span> • 
              <span className="text-red-400 ml-2">{discardCount} Discard</span>
            </p>
          </div>
          
          <Link
            href="/search"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            + Scout New Player
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-zinc-800/50 border-b border-zinc-700 py-3 px-4">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-white placeholder-zinc-400 w-64"
          />

          <select
            value={recFilter}
            onChange={(e) => setRecFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-white"
          >
            <option value="">All Recommendations</option>
            <option value="Sign">Sign</option>
            <option value="Monitor">Monitor</option>
            <option value="Discard">Discard</option>
          </select>

          <select
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm text-white"
          >
            <option value="">All Positions</option>
            <option value="Goalkeeper">Goalkeeper</option>
            <option value="Back">Defenders</option>
            <option value="Midfield">Midfielders</option>
            <option value="Wing">Wingers</option>
            <option value="Forward">Forwards</option>
          </select>

          {(search || recFilter || posFilter) && (
            <button
              onClick={() => { setSearch(''); setRecFilter(''); setPosFilter(''); }}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1800px] mx-auto p-4">
        {grades.length === 0 ? (
          <div className="bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 p-12 text-center">
            <p className="text-zinc-400 mb-4">No scouting reports yet</p>
            <Link
              href="/search"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
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
                    <th className="px-3 py-3 text-center font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('overall')}>
                      OVR <SortIcon col="overall" />
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('technical')}>
                      TEC <SortIcon col="technical" />
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('athletic')}>
                      ATH <SortIcon col="athletic" />
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('attacking')}>
                      ATK <SortIcon col="attacking" />
                    </th>
                    <th className="px-3 py-3 text-center font-medium text-zinc-400 cursor-pointer hover:text-white" onClick={() => handleSort('tactical')}>
                      TAC <SortIcon col="tactical" />
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-zinc-400">Strengths</th>
                    <th className="px-3 py-3 text-left font-medium text-zinc-400">Weaknesses</th>
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
                      <td className="px-3 py-2 text-center"><RecBadge rec={grade.recommendation} /></td>
                      <td className="px-3 py-2 text-center"><RatingBadge value={getOverallAvg(grade)} /></td>
                      <td className="px-3 py-2 text-center"><RatingBadge value={getTechnicalAvg(grade)} /></td>
                      <td className="px-3 py-2 text-center"><RatingBadge value={getAthleticAvg(grade)} /></td>
                      <td className="px-3 py-2 text-center"><RatingBadge value={getAttackingAvg(grade)} /></td>
                      <td className="px-3 py-2 text-center"><RatingBadge value={getTacticalAvg(grade)} /></td>
                      <td className="px-3 py-2"><TagsList tags={grade.strengths || []} color="green" /></td>
                      <td className="px-3 py-2"><TagsList tags={grade.weaknesses || []} color="red" /></td>
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

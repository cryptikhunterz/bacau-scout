'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlayerGrade, getRatingColor } from '@/lib/grades';

interface GradesTableProps {
  grades: PlayerGrade[];
}

type SortKey = 'playerName' | 'position' | 'club' | 'recommendation' | 'gradedAt' | 'technical' | 'athletic' | 'attacking' | 'tactical';

// Calculate category averages
function getTechnicalAvg(g: PlayerGrade): number {
  const vals = [g.dribblingBallControl, g.oneVsOneDribbling, g.passingRangeCreation, g.crossingDelivery].filter(v => v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0;
}

function getAthleticAvg(g: PlayerGrade): number {
  const vals = [g.accelerationPace, g.workRateStamina, g.physicalDuelingAerial].filter(v => v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0;
}

function getAttackingAvg(g: PlayerGrade): number {
  const vals = [g.goalContribution, g.carryingProgression, g.finishingShotPlacement].filter(v => v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0;
}

function getTacticalAvg(g: PlayerGrade): number {
  const vals = [g.positionalIntelligence, g.defensivePressingIntensity, g.oneVsOneDuels].filter(v => v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0;
}

function getOverallAvg(g: PlayerGrade): number {
  const avgs = [getTechnicalAvg(g), getAthleticAvg(g), getAttackingAvg(g), getTacticalAvg(g)].filter(v => v > 0);
  return avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length * 10) / 10 : 0;
}

export function GradesTable({ grades }: GradesTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('gradedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...grades].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    
    switch (sortKey) {
      case 'technical':
        aVal = getTechnicalAvg(a);
        bVal = getTechnicalAvg(b);
        break;
      case 'athletic':
        aVal = getAthleticAvg(a);
        bVal = getAthleticAvg(b);
        break;
      case 'attacking':
        aVal = getAttackingAvg(a);
        bVal = getAttackingAvg(b);
        break;
      case 'tactical':
        aVal = getTacticalAvg(a);
        bVal = getTacticalAvg(b);
        break;
      default:
        aVal = a[sortKey] ?? '';
        bVal = b[sortKey] ?? '';
    }
    
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Recommendation badge colors
  const recColors: Record<string, string> = {
    Sign: 'bg-green-600 text-white',
    Monitor: 'bg-yellow-600 text-white',
    Discard: 'bg-red-600 text-white',
  };

  // Rating badge color
  const getRatingBadgeColor = (rating: number): string => {
    if (rating <= 2) return 'bg-red-600 text-white';
    if (rating <= 4) return 'bg-orange-600 text-white';
    if (rating <= 6) return 'bg-yellow-600 text-white';
    return 'bg-green-600 text-white';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700">
            <SortHeader label="Player" sortKey="playerName" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Pos" sortKey="position" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Club" sortKey="club" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Rec" sortKey="recommendation" current={sortKey} dir={sortDir} onClick={handleSort} />
            <th className="text-center py-2 px-2 text-zinc-400 font-medium">Overall</th>
            <SortHeader label="Tech" sortKey="technical" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Athl" sortKey="athletic" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Att" sortKey="attacking" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Tact" sortKey="tactical" current={sortKey} dir={sortDir} onClick={handleSort} />
            <th className="text-left py-2 px-2 text-zinc-400 font-medium">Strengths</th>
            <th className="text-left py-2 px-2 text-zinc-400 font-medium">Weaknesses</th>
            <SortHeader label="Date" sortKey="gradedAt" current={sortKey} dir={sortDir} onClick={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((grade) => {
            const techAvg = getTechnicalAvg(grade);
            const athAvg = getAthleticAvg(grade);
            const attAvg = getAttackingAvg(grade);
            const tactAvg = getTacticalAvg(grade);
            const overall = getOverallAvg(grade);
            
            return (
              <tr
                key={grade.playerId}
                onClick={() => router.push(`/player/${grade.playerId}`)}
                className="border-b border-zinc-800 hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <td className="py-2 px-2 font-medium text-white">{grade.playerName}</td>
                <td className="py-2 px-2 text-zinc-400">{grade.position}</td>
                <td className="py-2 px-2 text-zinc-400">{grade.club}</td>
                <td className="py-2 px-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${recColors[grade.recommendation] || 'bg-zinc-600 text-white'}`}>
                    {grade.recommendation}
                  </span>
                </td>
                <td className="py-2 px-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRatingBadgeColor(overall)}`}>
                    {overall || '-'}
                  </span>
                </td>
                <td className="py-2 px-2 text-center text-zinc-300">{techAvg || '-'}</td>
                <td className="py-2 px-2 text-center text-zinc-300">{athAvg || '-'}</td>
                <td className="py-2 px-2 text-center text-zinc-300">{attAvg || '-'}</td>
                <td className="py-2 px-2 text-center text-zinc-300">{tactAvg || '-'}</td>
                <td className="py-2 px-2">
                  <div className="flex flex-wrap gap-1">
                    {grade.strengths.slice(0, 3).map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-green-900 text-green-300 rounded text-xs">{s}</span>
                    ))}
                    {grade.strengths.length > 3 && <span className="text-zinc-500 text-xs">+{grade.strengths.length - 3}</span>}
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex flex-wrap gap-1">
                    {grade.weaknesses.slice(0, 3).map((w, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-red-900 text-red-300 rounded text-xs">{w}</span>
                    ))}
                    {grade.weaknesses.length > 3 && <span className="text-zinc-500 text-xs">+{grade.weaknesses.length - 3}</span>}
                  </div>
                </td>
                <td className="py-2 px-2 text-zinc-500 text-xs">
                  {new Date(grade.gradedAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// SortHeader helper component
function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: 'asc' | 'desc';
  onClick: (key: SortKey) => void;
}) {
  const isActive = current === sortKey;
  return (
    <th
      className="text-left py-2 px-2 cursor-pointer hover:text-blue-400 text-zinc-400 font-medium transition-colors"
      onClick={() => onClick(sortKey)}
    >
      {label} {isActive && (dir === 'asc' ? '↑' : '↓')}
    </th>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlayerGrade, getAttributeColor, getPotentialColor, POTENTIAL_LABELS } from '@/lib/grades';

interface GradesTableProps {
  grades: PlayerGrade[];
}

type SortKey = 'playerName' | 'position' | 'club' | 'verdict' | 'gradedAt' | 'physical' | 'technique' | 'tactic' | 'ability' | 'potential';

// Calculate category averages (1-5 scale)
function getPhysicalAvg(g: PlayerGrade): number {
  const vals = [g.physStrength, g.physSpeed, g.physAgility, g.physCoordination].filter(v => v && v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0;
}

function getTechniqueAvg(g: PlayerGrade): number {
  const vals = [g.techControl, g.techShortPasses, g.techLongPasses, g.techAerial,
    g.techCrossing, g.techFinishing, g.techDribbling, g.techOneVsOneOffense, g.techOneVsOneDefense].filter(v => v && v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0;
}

function getTacticAvg(g: PlayerGrade): number {
  const vals = [g.tacPositioning, g.tacTransition, g.tacDecisions, g.tacAnticipations, g.tacDuels, g.tacSetPieces].filter(v => v && v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : 0;
}

// Verdict badge colors
const verdictColors: Record<string, string> = {
  'Sign': 'bg-green-600 text-white',
  'Monitor': 'bg-yellow-500 text-black',
  'Not a priority': 'bg-zinc-600 text-white',
  'Out of reach': 'bg-red-600 text-white',
  'Discard': 'bg-red-900 text-white',
};

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
      case 'physical': aVal = getPhysicalAvg(a); bVal = getPhysicalAvg(b); break;
      case 'technique': aVal = getTechniqueAvg(a); bVal = getTechniqueAvg(b); break;
      case 'tactic': aVal = getTacticAvg(a); bVal = getTacticAvg(b); break;
      case 'ability': aVal = a.ability || 0; bVal = b.ability || 0; break;
      case 'potential': aVal = a.potential || 0; bVal = b.potential || 0; break;
      default: aVal = a[sortKey] ?? ''; bVal = b[sortKey] ?? '';
    }

    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700">
            <SortHeader label="Player" sortKey="playerName" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Pos" sortKey="position" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Club" sortKey="club" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Verdict" sortKey="verdict" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="ABL" sortKey="ability" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="POT" sortKey="potential" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="PHY" sortKey="physical" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="TEC" sortKey="technique" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="TAC" sortKey="tactic" current={sortKey} dir={sortDir} onClick={handleSort} />
            <th className="text-left py-2 px-2 text-zinc-400 font-medium">Tags</th>
            <SortHeader label="Date" sortKey="gradedAt" current={sortKey} dir={sortDir} onClick={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((grade) => (
            <tr key={grade.playerId}
              onClick={() => router.push(`/player/${grade.playerId}`)}
              className="border-b border-zinc-800 hover:bg-zinc-800 cursor-pointer transition-colors">
              <td className="py-2 px-2 font-medium text-white">{grade.playerName}</td>
              <td className="py-2 px-2 text-zinc-400">{grade.position}</td>
              <td className="py-2 px-2 text-zinc-400">{grade.club}</td>
              <td className="py-2 px-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${verdictColors[grade.verdict] || 'bg-zinc-600 text-white'}`}>
                  {grade.verdict}
                </span>
              </td>
              <td className="py-2 px-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getPotentialColor(grade.ability || 0)}`}>
                  {POTENTIAL_LABELS[grade.ability || 0] || '-'}
                </span>
              </td>
              <td className="py-2 px-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getPotentialColor(grade.potential || 0)}`}>
                  {POTENTIAL_LABELS[grade.potential || 0] || '-'}
                </span>
              </td>
              <td className="py-2 px-2 text-center text-zinc-300">{getPhysicalAvg(grade) || '-'}</td>
              <td className="py-2 px-2 text-center text-zinc-300">{getTechniqueAvg(grade) || '-'}</td>
              <td className="py-2 px-2 text-center text-zinc-300">{getTacticAvg(grade) || '-'}</td>
              <td className="py-2 px-2">
                <div className="flex flex-wrap gap-1">
                  {(grade.scoutingTags || []).slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-blue-900 text-blue-300 rounded text-xs">{tag}</span>
                  ))}
                </div>
              </td>
              <td className="py-2 px-2 text-zinc-500 text-xs">
                {new Date(grade.gradedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortHeader({ label, sortKey, current, dir, onClick }: {
  label: string; sortKey: SortKey; current: SortKey; dir: 'asc' | 'desc'; onClick: (key: SortKey) => void;
}) {
  const isActive = current === sortKey;
  return (
    <th className="text-left py-2 px-2 cursor-pointer hover:text-blue-400 text-zinc-400 font-medium transition-colors"
      onClick={() => onClick(sortKey)}>
      {label} {isActive && (dir === 'asc' ? '↑' : '↓')}
    </th>
  );
}

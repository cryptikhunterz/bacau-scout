'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlayerGrade } from '@/lib/grades';

interface GradesTableProps {
  grades: PlayerGrade[];
}

type SortKey = 'playerName' | 'position' | 'abilityRating' | 'potentialRating' | 'recommendation' | 'playerCategory' | 'gradedAt';

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
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Render stars as ★★★☆☆
  const renderStars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  // Recommendation badge colors
  const recColors: Record<string, string> = {
    Sign: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Monitor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Discard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <SortHeader label="Player" sortKey="playerName" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Pos" sortKey="position" current={sortKey} dir={sortDir} onClick={handleSort} />
            <th className="text-left py-2 px-2 text-zinc-600 dark:text-zinc-400 font-medium">Club</th>
            <SortHeader label="Cat" sortKey="playerCategory" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Ability" sortKey="abilityRating" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Potential" sortKey="potentialRating" current={sortKey} dir={sortDir} onClick={handleSort} />
            <SortHeader label="Rec" sortKey="recommendation" current={sortKey} dir={sortDir} onClick={handleSort} />
            <th className="text-center py-2 px-1 text-zinc-600 dark:text-zinc-400 font-medium">Tech</th>
            <th className="text-center py-2 px-1 text-zinc-600 dark:text-zinc-400 font-medium">Tact</th>
            <th className="text-center py-2 px-1 text-zinc-600 dark:text-zinc-400 font-medium">Phys</th>
            <th className="text-center py-2 px-1 text-zinc-600 dark:text-zinc-400 font-medium">Ment</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((grade) => (
            <tr
              key={grade.playerId}
              onClick={() => router.push(`/player/${grade.playerId}`)}
              className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            >
              <td className="py-2 px-2 font-medium text-zinc-900 dark:text-white">{grade.playerName}</td>
              <td className="py-2 px-2 text-zinc-500">{grade.position}</td>
              <td className="py-2 px-2 text-zinc-500">{grade.club}</td>
              <td className="py-2 px-2 text-zinc-900 dark:text-white">{grade.playerCategory}</td>
              <td className="py-2 px-2 text-center text-zinc-900 dark:text-white">{grade.abilityRating}</td>
              <td className="py-2 px-2 text-center text-zinc-900 dark:text-white">{grade.potentialRating}</td>
              <td className="py-2 px-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${recColors[grade.recommendation]}`}>
                  {grade.recommendation}
                </span>
              </td>
              <td className="py-2 px-1 text-center text-yellow-500 text-xs">{renderStars(grade.technicalRating)}</td>
              <td className="py-2 px-1 text-center text-yellow-500 text-xs">{renderStars(grade.tacticalRating)}</td>
              <td className="py-2 px-1 text-center text-yellow-500 text-xs">{renderStars(grade.physicalRating)}</td>
              <td className="py-2 px-1 text-center text-yellow-500 text-xs">{renderStars(grade.mentalRating)}</td>
            </tr>
          ))}
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
      className="text-left py-2 px-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-zinc-600 dark:text-zinc-400 font-medium transition-colors"
      onClick={() => onClick(sortKey)}
    >
      {label} {isActive && (dir === 'asc' ? '↑' : '↓')}
    </th>
  );
}

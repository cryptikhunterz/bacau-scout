'use client';

import { SearchPlayer, formatMarketValue } from '@/types/player';
import PlayerCard from './PlayerCard';

export type ViewMode = 'grid' | 'list';

// Animation wrapper for staggered entrance effect
function AnimatedItem({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  // Only animate first 10 cards for performance
  const shouldAnimate = index < 10;
  const delay = shouldAnimate ? index * 50 : 0;

  return (
    <div
      className={shouldAnimate ? 'animate-fadeInUp' : ''}
      style={shouldAnimate ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

interface PlayerListProps {
  players: SearchPlayer[];
  viewMode: ViewMode;
}

// Compact list row for list view
function PlayerRow({ player }: { player: SearchPlayer }) {
  return (
    <div
      className="flex items-center justify-between py-2 px-3 bg-white dark:bg-zinc-800
                 border border-zinc-200 dark:border-zinc-700 rounded-md
                 hover:shadow-sm transition-shadow cursor-pointer"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-zinc-900 dark:text-white truncate block">
            {player.name}
          </span>
        </div>
        <span className="text-sm text-zinc-600 dark:text-zinc-400 w-24 text-center shrink-0">
          {player.position || '-'}
        </span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400 w-12 text-center shrink-0">
          {player.age || '-'}
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-500 w-36 truncate shrink-0">
          {player.club || '-'}
        </span>
      </div>
      <div className="text-right shrink-0 ml-4">
        <span className="font-semibold text-green-600 dark:text-green-400">
          {formatMarketValue(player.marketValue)}
        </span>
      </div>
    </div>
  );
}

export default function PlayerList({ players, viewMode }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
        No players to display
      </p>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-1">
        {/* List header */}
        <div className="flex items-center justify-between py-1 px-3 text-xs font-medium
                        text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <span className="flex-1 min-w-0">Name</span>
            <span className="w-24 text-center shrink-0">Position</span>
            <span className="w-12 text-center shrink-0">Age</span>
            <span className="w-36 shrink-0">Club</span>
          </div>
          <span className="shrink-0 ml-4">Value</span>
        </div>
        {players.map((player, index) => (
          <AnimatedItem key={`${player.name}-${index}`} index={index}>
            <PlayerRow player={player} />
          </AnimatedItem>
        ))}
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map((player, index) => (
        <AnimatedItem key={`${player.name}-${index}`} index={index}>
          <PlayerCard player={player} />
        </AnimatedItem>
      ))}
    </div>
  );
}

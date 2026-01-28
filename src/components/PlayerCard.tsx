'use client';

import { SearchPlayer, formatMarketValue } from '@/types/player';

interface PlayerCardProps {
  player: SearchPlayer;
}

export default function PlayerCard({ player }: PlayerCardProps) {
  return (
    <div
      className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700
                 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
            {player.name}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {player.position || 'Position unknown'}
            {player.age && ` • Age ${player.age}`}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            {player.club || 'Club unknown'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-green-600 dark:text-green-400">
            {formatMarketValue(player.marketValue)}
          </p>
          {player.nationality && player.nationality.length > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              {player.nationality.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { SearchPlayer, formatMarketValue } from '@/types/player';

interface PlayerCardProps {
  player: SearchPlayer;
}

// Skeleton loading card that matches PlayerCard layout
export function SkeletonCard() {
  return (
    <div
      className="block p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700
                 rounded-lg"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Name skeleton */}
          <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-32 mb-2" />
          {/* Position/age skeleton */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-24 mb-1" />
          {/* Club skeleton */}
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-28" />
        </div>
        <div className="text-right">
          {/* Market value skeleton */}
          <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-20 mb-1" />
          {/* Nationality skeleton */}
          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-16 mt-1" />
        </div>
      </div>
    </div>
  );
}

export default function PlayerCard({ player }: PlayerCardProps) {
  // Build player URL: use playerId if available, otherwise encode name as fallback
  const playerUrl = player.playerId
    ? `/player/${player.playerId}`
    : `/player/${encodeURIComponent(player.name)}`;

  return (
    <Link
      href={playerUrl}
      className="block p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700
                 rounded-lg hover:shadow-md transition-shadow cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 dark:focus:ring-offset-zinc-900"
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
    </Link>
  );
}

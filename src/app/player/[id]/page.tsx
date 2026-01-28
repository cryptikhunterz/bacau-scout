import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatMarketValue } from '@/types/player';

interface PlayerData {
  name: string;
  position: string | null;
  age: string | null;
  club: string | null;
  marketValue: string | null;
  nationality: string[];
  url: string | null;
  playerId: string | null;
  leagueUrl: string | null;
}

async function getPlayer(id: string): Promise<PlayerData | null> {
  // Use absolute URL for server-side fetch
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/player/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching player:', error);
    return null;
  }
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayer(id);

  if (!player) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-zinc-600 dark:text-zinc-400
                     hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors
                     min-h-[44px] py-2"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Search
        </Link>

        {/* Player header */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            {player.name}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {player.position || 'Position unknown'}
          </p>
        </div>

        {/* Player stats grid */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Player Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4">
            <div className="py-2">
              <p className="text-sm text-zinc-500 dark:text-zinc-500">Age</p>
              <p className="text-lg font-medium text-zinc-900 dark:text-white">
                {player.age || '-'}
              </p>
            </div>
            <div className="py-2">
              <p className="text-sm text-zinc-500 dark:text-zinc-500">Club</p>
              <p className="text-lg font-medium text-zinc-900 dark:text-white">
                {player.club || '-'}
              </p>
            </div>
            <div className="py-2">
              <p className="text-sm text-zinc-500 dark:text-zinc-500">Market Value</p>
              <p className="text-lg font-medium text-green-600 dark:text-green-400">
                {formatMarketValue(player.marketValue)}
              </p>
            </div>
            <div className="py-2">
              <p className="text-sm text-zinc-500 dark:text-zinc-500">Nationality</p>
              <p className="text-lg font-medium text-zinc-900 dark:text-white">
                {player.nationality && player.nationality.length > 0
                  ? player.nationality.join(', ')
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* External links */}
        {player.url && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              External Links
            </h2>
            <a
              href={player.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 dark:text-blue-400
                       hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              View on Transfermarkt
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

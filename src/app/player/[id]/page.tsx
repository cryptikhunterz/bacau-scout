import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatMarketValue, PlayerStats, CareerTotals } from '@/types/player';
import { PlayerGrading } from '@/components/PlayerGrading';

interface PlayerData {
  id: string;
  name: string;
  tmUrl: string;
  position: string;
  altPositions?: string[];
  age: number;
  nationality: string;
  secondNationality?: string;
  birthDate?: string;
  birthplace?: string;
  club: string;
  league?: string;
  marketValue: string | null;
  height?: string;
  foot?: string;
  contractUntil?: string | null;
  shirtNumber?: string;
  stats: PlayerStats[];
  careerTotals?: CareerTotals | null;
}

async function getPlayer(id: string): Promise<PlayerData | null> {
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
    <main className="min-h-screen bg-zinc-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-zinc-400
                     hover:text-white mb-6 transition-colors
                     min-h-[44px] py-2"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Search
        </Link>

        {/* Player header */}
        <div className="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {player.name}
              </h1>
              <p className="text-lg text-zinc-400">
                {player.position}
              </p>
              {player.altPositions && player.altPositions.length > 0 && (
                <p className="text-sm text-zinc-500">
                  Also: {player.altPositions.join(', ')}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-400">
                {formatMarketValue(player.marketValue)}
              </p>
              <p className="text-sm text-zinc-500">
                Market Value
              </p>
            </div>
          </div>
        </div>

        {/* Player info grid */}
        <div className="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Player Information
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <InfoItem label="Age" value={player.age?.toString()} />
            <InfoItem label="Club" value={player.club} />
            <InfoItem label="League" value={player.league} />
            <InfoItem label="Nationality" value={player.nationality} />
            {player.secondNationality && (
              <InfoItem label="2nd Nationality" value={player.secondNationality} />
            )}
            <InfoItem label="Birth Date" value={player.birthDate} />
            {player.birthplace && <InfoItem label="Birthplace" value={player.birthplace} />}
            {player.height && <InfoItem label="Height" value={player.height} />}
            {player.foot && <InfoItem label="Foot" value={player.foot} />}
            {player.contractUntil && player.contractUntil !== '-' && (
              <InfoItem label="Contract Until" value={player.contractUntil} />
            )}
          </div>
        </div>

        {/* Stats from Transfermarkt profile */}
        {player.careerTotals && (
          <div className="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              2025/26 Stats
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <StatBox label="Matches" value={player.careerTotals.matches} />
              <StatBox label="Goals" value={player.careerTotals.goals} highlight />
              <StatBox label="Assists" value={player.careerTotals.assists} />
            </div>
          </div>
        )}

        {/* Competition breakdown removed - data was unreliable */}

        {/* Scout Evaluation */}
        <div className="mb-6">
          <PlayerGrading
            player={{
              id: player.id,
              name: player.name,
              position: player.position,
              club: player.club,
            }}
          />
        </div>

        {/* External links */}
        {player.tmUrl && (
          <div className="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              External Links
            </h2>
            <a
              href={player.tmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-400
                       hover:text-blue-300 transition-colors"
            >
              View on Transfermarkt
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="py-1">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="py-2">
      <p
        className={`text-2xl font-bold ${
          highlight ? 'text-green-400' : 'text-white'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

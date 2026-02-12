import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatMarketValue } from '@/types/player';
import { PlayerGrading } from '@/components/PlayerGrading';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { findPlayerById, PlayerDetail } from '@/lib/players';

// Position colors
const posColors: Record<string, string> = {
  'Goalkeeper': 'from-yellow-500 to-yellow-600',
  'Defender': 'from-blue-500 to-blue-600',
  'Centre-Back': 'from-blue-500 to-blue-600',
  'Left-Back': 'from-blue-400 to-blue-500',
  'Right-Back': 'from-blue-400 to-blue-500',
  'Midfield': 'from-green-500 to-green-600',
  'Central Midfield': 'from-green-500 to-green-600',
  'Defensive Midfield': 'from-green-600 to-green-700',
  'Attacking Midfield': 'from-green-400 to-green-500',
  'Left Winger': 'from-purple-500 to-purple-600',
  'Right Winger': 'from-purple-500 to-purple-600',
  'Centre-Forward': 'from-red-500 to-red-600',
  'Attack': 'from-red-500 to-red-600',
};

function getPosGradient(pos: string): string {
  for (const [key, val] of Object.entries(posColors)) {
    if (pos?.includes(key)) return val;
  }
  return 'from-zinc-500 to-zinc-600';
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = findPlayerById(id);
  if (!player) notFound();

  const posGradient = getPosGradient(player.position || '');
  const totals = player.careerTotals;
  const hasStats = player.stats && player.stats.length > 0;
  const isGoalkeeper = player.position?.toLowerCase().includes('goalkeeper') ?? false;

  // Group stats by season
  const seasonGroups = new Map<string, typeof player.stats>();
  for (const s of player.stats || []) {
    const existing = seasonGroups.get(s.season) || [];
    existing.push(s);
    seasonGroups.set(s.season, existing);
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Top bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/search"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Search Players
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Hero Card */}
        <div className={`bg-gradient-to-r ${posGradient} rounded-xl p-[1px] mb-6`}>
          <div className="bg-zinc-900 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                {/* Player Photo / Avatar */}
                <PlayerAvatar
                  photoUrl={player.photoUrl}
                  name={player.name}
                  fallbackText={player.shirtNumber || undefined}
                  size="w-20 h-20"
                  rounded="rounded-xl"
                  gradient={`bg-gradient-to-br ${posGradient}`}
                  fallbackBg="bg-zinc-800"
                  fallbackTextSize="text-2xl"
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {player.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${posGradient}`}>
                      {player.position || 'Unknown'}
                    </span>
                    {player.age && (
                      <span className="text-sm text-zinc-400">
                        Age {player.age}
                      </span>
                    )}
                    {player.nationality && (
                      <span className="text-sm text-zinc-500">
                        • {player.nationality}
                        {player.secondNationality && ` / ${player.secondNationality}`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    {player.club || 'Free Agent'}
                    {player.league && <span className="text-zinc-600"> • {player.league}</span>}
                  </p>
                </div>
              </div>

              {/* Market Value */}
              <div className="text-right sm:text-right">
                <p className="text-3xl font-bold text-green-400">
                  {formatMarketValue(player.marketValue)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Market Value</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Info + Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Career Totals */}
            {totals && (totals.matches > 0 || totals.goals > 0) && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  Career Overview
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label="Appearances" value={totals.matches} icon="⚽" />
                  <StatCard label={isGoalkeeper ? 'Goals (rare for GK)' : 'Goals'} value={totals.goals} icon={isGoalkeeper ? '🧤' : '🥅'} highlight={!isGoalkeeper} />
                  <StatCard label={isGoalkeeper ? 'Assists (rare for GK)' : 'Assists'} value={totals.assists} icon={isGoalkeeper ? '🧤' : '🅰️'} />
                  <StatCard label="Minutes" value={totals.minutes.toLocaleString()} icon="⏱️" />
                </div>
                {isGoalkeeper && (
                  <div className="mt-3 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-400/80">
                      ℹ️ Goalkeeper stats — saves, clean sheets, and other GK-specific metrics are not available from Transfermarkt. Only appearances, goals, assists, and minutes are provided.
                    </p>
                  </div>
                )}
                {totals.matches > 0 && totals.goals > 0 && !isGoalkeeper && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-zinc-500">Goals/Game: </span>
                        <span className="text-white font-semibold">
                          {(totals.goals / totals.matches).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Assists/Game: </span>
                        <span className="text-white font-semibold">
                          {(totals.assists / totals.matches).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">G+A/Game: </span>
                        <span className="text-green-400 font-semibold">
                          {((totals.goals + totals.assists) / totals.matches).toFixed(2)}
                        </span>
                      </div>
                      {totals.minutes > 0 && (
                        <div>
                          <span className="text-zinc-500">Min/Goal: </span>
                          <span className="text-white font-semibold">
                            {totals.goals > 0 ? Math.round(totals.minutes / totals.goals) : '∞'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {totals.matches > 0 && isGoalkeeper && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-zinc-500">Min/App: </span>
                        <span className="text-white font-semibold">
                          {totals.minutes > 0 ? Math.round(totals.minutes / totals.matches) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Season Stats Table */}
            {hasStats && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="p-4 border-b border-zinc-800">
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                    Season by Season
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-800/50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Season</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Competition</th>
                        <th className="px-4 py-2.5 text-center text-xs font-medium text-zinc-500 uppercase">Apps</th>
                        <th className="px-4 py-2.5 text-center text-xs font-medium text-zinc-500 uppercase">{isGoalkeeper ? 'Goals*' : 'Goals'}</th>
                        <th className="px-4 py-2.5 text-center text-xs font-medium text-zinc-500 uppercase">{isGoalkeeper ? 'Assists*' : 'Assists'}</th>
                        <th className="px-4 py-2.5 text-center text-xs font-medium text-zinc-500 uppercase">G+A</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {player.stats.map((stat, i) => (
                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-2 text-white font-medium">{stat.season}</td>
                          <td className="px-4 py-2 text-zinc-400">{stat.competition || '-'}</td>
                          <td className="px-4 py-2 text-center text-zinc-300">{stat.matches}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={stat.goals > 0 ? 'text-green-400 font-semibold' : 'text-zinc-500'}>
                              {stat.goals}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={stat.assists > 0 ? 'text-blue-400 font-semibold' : 'text-zinc-500'}>
                              {stat.assists}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={stat.goals + stat.assists > 0 ? 'text-yellow-400 font-semibold' : 'text-zinc-500'}>
                              {stat.goals + stat.assists}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Scout Evaluation */}
            <div>
              <PlayerGrading
                player={{
                  id: player.id,
                  name: player.name,
                  position: player.position || '',
                  club: player.club || '',
                }}
              />
            </div>
          </div>

          {/* Right column: Player Info */}
          <div className="space-y-6">
            {/* Player Details Card */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Player Details
              </h2>
              <div className="space-y-3">
                <DetailRow label="Full Name" value={player.name} />
                <DetailRow label="Position" value={player.position} />
                <DetailRow label="Age" value={player.age?.toString()} />
                <DetailRow label="Birth Date" value={player.birthDate} />
                {player.birthplace && <DetailRow label="Birthplace" value={player.birthplace} />}
                <DetailRow label="Height" value={player.height} />
                <DetailRow label="Foot" value={player.foot} />
                <DetailRow label="Nationality" value={player.nationality} />
                {player.secondNationality && <DetailRow label="2nd Nationality" value={player.secondNationality} />}
              </div>
            </div>

            {/* Contract Card */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Contract
              </h2>
              <div className="space-y-3">
                <DetailRow label="Club" value={player.club} />
                <DetailRow label="League" value={player.league} />
                {player.shirtNumber && <DetailRow label="Shirt #" value={player.shirtNumber} />}
                {player.contractUntil && player.contractUntil !== '-' && (
                  <DetailRow label="Expires" value={player.contractUntil} />
                )}
                <DetailRow label="Market Value" value={formatMarketValue(player.marketValue)} highlight />
              </div>
            </div>

            {/* Links */}
            {player.tmUrl && (
              <a
                href={player.tmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-blue-400 hover:text-blue-300 hover:border-blue-800 transition-all text-sm font-medium"
              >
                View on Transfermarkt
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon, highlight = false }: {
  label: string;
  value: number | string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
      <div className="text-lg mb-1">{icon}</div>
      <p className={`text-2xl font-bold ${highlight ? 'text-green-400' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

function DetailRow({ label, value, highlight = false }: {
  label: string;
  value?: string | null;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-green-400' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

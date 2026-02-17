import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatMarketValue } from '@/types/player';
import { PlayerGrading } from '@/components/PlayerGrading';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { findPlayerById, PlayerDetail } from '@/lib/players';
import { WyscoutStatsWrapper } from './WyscoutStatsWrapper';

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

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Top bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <Link href="/search" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Search Players
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">

        {/* ─── HEADER: Photo + Name + Details + Contract ─── */}
        <div className={`bg-gradient-to-r ${posGradient} rounded-xl p-[1px]`}>
          <div className="bg-zinc-900 rounded-xl p-5">
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Left: Photo + Name */}
              <div className="flex items-start gap-4 flex-shrink-0">
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
                  <h1 className="text-2xl font-bold text-white">{player.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${posGradient}`}>
                      {player.position || 'Unknown'}
                    </span>
                    {player.age && <span className="text-sm text-zinc-400">Age {player.age}</span>}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    {player.club || 'Free Agent'}
                    {player.league && <span className="text-zinc-600"> • {player.league}</span>}
                  </p>
                </div>
              </div>

              {/* Middle: Player Details grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm border-l border-zinc-800 pl-5">
                <DetailRow label="Height" value={player.height} />
                <DetailRow label="Foot" value={player.foot} />
                <DetailRow label="Birth" value={player.birthDate} />
                <DetailRow label="Nationality" value={player.nationality} />
                {player.secondNationality && <DetailRow label="2nd Nat." value={player.secondNationality} />}
                {player.birthplace && <DetailRow label="Birthplace" value={player.birthplace} />}
                {player.shirtNumber && <DetailRow label="Shirt" value={`#${player.shirtNumber}`} />}
                {player.contractUntil && player.contractUntil !== '-' && <DetailRow label="Contract" value={player.contractUntil} />}
              </div>

              {/* Right: Market Value + TM Link */}
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-400">{formatMarketValue(player.marketValue)}</p>
                  <p className="text-xs text-zinc-500">Market Value</p>
                </div>
                {player.tmUrl && (
                  <a href={player.tmUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                    Transfermarkt ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── CAREER STRIP ─── */}
        {totals && (totals.matches > 0 || totals.goals > 0) && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 px-5 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Career</h2>
              <div className="flex items-center gap-1.5"><span className="text-zinc-500 text-xs">Apps</span><span className="text-white font-bold text-sm">{totals.matches}</span></div>
              <div className="flex items-center gap-1.5"><span className="text-zinc-500 text-xs">Goals</span><span className={`font-bold text-sm ${!isGoalkeeper && totals.goals > 0 ? 'text-green-400' : 'text-white'}`}>{totals.goals}</span></div>
              <div className="flex items-center gap-1.5"><span className="text-zinc-500 text-xs">Assists</span><span className="text-white font-bold text-sm">{totals.assists}</span></div>
              <div className="flex items-center gap-1.5"><span className="text-zinc-500 text-xs">Minutes</span><span className="text-white font-bold text-sm">{totals.minutes.toLocaleString()}</span></div>
              {totals.matches > 0 && totals.goals > 0 && !isGoalkeeper && (
                <>
                  <div className="w-px h-4 bg-zinc-700" />
                  <div className="flex items-center gap-1.5"><span className="text-zinc-500 text-xs">G/Game</span><span className="text-white font-semibold text-sm">{(totals.goals / totals.matches).toFixed(2)}</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-zinc-500 text-xs">A/Game</span><span className="text-white font-semibold text-sm">{(totals.assists / totals.matches).toFixed(2)}</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-zinc-500 text-xs">G+A/Game</span><span className="text-green-400 font-semibold text-sm">{((totals.goals + totals.assists) / totals.matches).toFixed(2)}</span></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── HERO: Wyscout Radars + Stat Bars ─── */}
        <WyscoutStatsWrapper playerId={player.id} tmPosition={player.position || undefined} />

        {/* ─── Season Stats ─── */}
          {hasStats && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="p-4 border-b border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Season by Season</h2>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-800/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase">Season</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 uppercase">Competition</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-zinc-500 uppercase">Apps</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-zinc-500 uppercase">Goals</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-zinc-500 uppercase">Ast</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-zinc-500 uppercase">G+A</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {player.stats.map((stat, i) => (
                      <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-3 py-1.5 text-white font-medium text-xs">{stat.season}</td>
                        <td className="px-3 py-1.5 text-zinc-400 text-xs">{stat.competition || '-'}</td>
                        <td className="px-3 py-1.5 text-center text-zinc-300 text-xs">{stat.matches}</td>
                        <td className="px-3 py-1.5 text-center text-xs">
                          <span className={stat.goals > 0 ? 'text-green-400 font-semibold' : 'text-zinc-500'}>{stat.goals}</span>
                        </td>
                        <td className="px-3 py-1.5 text-center text-xs">
                          <span className={stat.assists > 0 ? 'text-blue-400 font-semibold' : 'text-zinc-500'}>{stat.assists}</span>
                        </td>
                        <td className="px-3 py-1.5 text-center text-xs">
                          <span className={stat.goals + stat.assists > 0 ? 'text-yellow-400 font-semibold' : 'text-zinc-500'}>{stat.goals + stat.assists}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* ─── Scout Evaluation (full width) ─── */}
        <PlayerGrading
          player={{
            id: player.id,
            name: player.name,
            position: player.position || '',
            club: player.club || '',
          }}
        />
      </div>
    </main>
  );
}

function DetailRow({ label, value, highlight = false }: {
  label: string;
  value?: string | null;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs font-medium ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}

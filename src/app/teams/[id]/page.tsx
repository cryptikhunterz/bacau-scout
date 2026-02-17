'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { WyscoutTeam, BacauReference } from '@/lib/wyscoutTeamTypes';
import { loadTeam, loadBacauReference } from '@/lib/wyscoutTeamData';
import { RadarChart } from '@/components/RadarChart';

interface PlayerListItem {
  id: number;
  n: string;
  sn: string;
  cl: string;
  pos: string;
  pg: string;
  age: number;
  min: number;
  mp: number;
  lg: string;
  mv: string;
  mvn: number;
  nat: string[];
  pid?: string;
}

const COUNTRY_MAP: Record<string, string> = {
  A1: '🇦🇹 Austria', A2: '🇦🇹 Austria',
  ALB1: '🇦🇱 Albania',
  BE2: '🇧🇪 Belgium',
  BOS1: '🇧🇦 Bosnia',
  CN2: '🇫🇷 France',
  ES3: '🇪🇸 Spain',
  EST1: '🇪🇪 Estonia',
  FI1: '🇫🇮 Finland',
  FR3: '🇫🇷 France',
  IT2: '🇮🇹 Italy', IT3: '🇮🇹 Italy',
  KO1: '🇽🇰 Kosovo',
  KR1: '🇭🇷 Croatia', KR2: '🇭🇷 Croatia',
  LI1: '🇱🇹 Lithuania',
  MNE1: '🇲🇪 Montenegro',
  MNP3: '🇺🇸 United States',
  NL2: '🇳🇱 Netherlands',
  PL1: '🇵🇱 Poland', PL2: '🇵🇱 Poland',
  PO2: '🇵🇹 Portugal',
  PT3: '🇵🇹 Portugal',
  RO1: '🇷🇴 Romania', RO2: '🇷🇴 Romania',
  SER1: '🇷🇸 Serbia', SER2: '🇷🇸 Serbia',
  SL1: '🇸🇮 Slovenia', SL2: '🇸🇮 Slovenia',
  SLO1: '🇸🇰 Slovakia',
  TS1: '🇨🇿 Czechia', TS2: '🇨🇿 Czechia',
};

function getCountry(tmCode: string): string {
  return COUNTRY_MAP[tmCode] || tmCode;
}

function styleMatchColor(sm: number | null): string {
  if (sm === null) return 'text-zinc-500';
  if (sm >= 95) return 'text-green-400';
  if (sm >= 90) return 'text-green-300';
  if (sm >= 85) return 'text-emerald-400';
  if (sm >= 80) return 'text-yellow-400';
  return 'text-zinc-400';
}

function percentileColor(p: number): string {
  if (p >= 90) return 'text-green-400';
  if (p >= 65) return 'text-green-300';
  if (p >= 35) return 'text-zinc-300';
  return 'text-red-400';
}

function percentileBarColor(p: number): string {
  if (p >= 90) return 'bg-green-500';
  if (p >= 65) return 'bg-green-400';
  if (p >= 35) return 'bg-zinc-500';
  return 'bg-red-500';
}

// Group team metrics by category
function groupMetrics(m: Record<string, number>, ml: Record<string, string>, p: Record<string, number>) {
  const groups: Record<string, { key: string; label: string; value: number; percentile: number }[]> = {};
  for (const [key, value] of Object.entries(m)) {
    const [group] = key.split('/');
    const groupName = group.charAt(0).toUpperCase() + group.slice(1);
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push({
      key,
      label: ml[key] || key.split('/')[1] || key,
      value,
      percentile: p[key] ?? 50,
    });
  }
  return groups;
}

export default function TeamDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [team, setTeam] = useState<WyscoutTeam | null>(null);
  const [bacau, setBacau] = useState<BacauReference | null>(null);
  const [roster, setRoster] = useState<PlayerListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      loadTeam(id),
      loadBacauReference(),
      fetch('/api/wyscout-data/players-list.json').then(r => r.json()).catch(() => []),
    ]).then(([t, b, players]) => {
      setTeam(t);
      setBacau(b);
      // Match roster by team name
      if (t && players) {
        const teamName = t.n.toLowerCase();
        const matched = (players as PlayerListItem[]).filter(p => {
          const club = (p.cl || '').toLowerCase();
          return club === teamName || club.includes(teamName) || teamName.includes(club);
        });
        setRoster(matched.sort((a, b) => {
          const posOrder: Record<string, number> = { GK: 0, CB: 1, WB: 2, DM: 3, CM: 4, AM: 5, FW: 6 };
          return (posOrder[a.pg] ?? 9) - (posOrder[b.pg] ?? 9);
        }));
      }
      setLoading(false);
    });
  }, [id]);

  const metricGroups = useMemo(() => {
    if (!team) return {};
    return groupMetrics(team.m, team.ml, team.p);
  }, [team]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-zinc-400 text-lg">Loading team data...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="text-zinc-400 text-lg">Team not found</div>
        <Link href="/teams" className="text-blue-400 hover:text-blue-300">← Back to teams</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="bg-zinc-800 border-b border-zinc-700 py-4 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/teams" className="text-zinc-400 hover:text-white text-sm">← Teams</Link>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500 text-sm">{team.comp}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{team.n}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-zinc-400 text-sm">{getCountry(team.tm)}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400 text-sm">{team.season}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Style Match vs FC Bacău</div>
              <div className={`text-3xl font-bold font-mono ${styleMatchColor(team.styleMatch)}`}>
                {team.styleMatch !== null ? `${team.styleMatch}%` : '—'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Radar Chart */}
        {team.radar && team.radar.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">📊 Team Radar</h2>
            <div className="max-w-[500px] mx-auto">
              <RadarChart
                labels={team.radar.map(r => r.label)}
                values={team.radar.map(r => r.percentile ?? 50)}
                maxValue={100}
                mode="percentile"
                displayValues={team.radar.map(r => r.value)}
                percentiles={team.radar.map(r => r.percentile ?? 50)}
                title={`${team.n} PROFILE`}
              />
            </div>
          </div>
        )}

        {/* Team Stats */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📈 Team Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(metricGroups).map(([group, metrics]) => (
              <div key={group}>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 border-b border-zinc-800 pb-2">
                  {group === 'General' ? '⚽ General' : group === 'Attack' ? '⚔️ Attack' : group === 'Defence' ? '🛡️ Defence' : `🏗️ ${group}`}
                </h3>
                <div className="space-y-2">
                  {metrics.map(m => (
                    <div key={m.key} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-400 truncate flex-1">{m.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-300 w-12 text-right">{typeof m.value === 'number' ? m.value.toFixed(1) : m.value}</span>
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${percentileBarColor(m.percentile)}`} style={{ width: `${m.percentile}%` }} />
                        </div>
                        <span className={`text-xs font-mono w-8 text-right ${percentileColor(m.percentile)}`}>
                          {m.percentile}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Similar Teams */}
        {team.similar && team.similar.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">🔗 Similar Teams</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {team.similar.map(s => (
                <Link
                  key={s.id}
                  href={`/teams/${s.id}`}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:bg-zinc-800 transition-colors"
                >
                  <div className="font-medium text-white text-sm">{s.name}</div>
                  <div className="text-xs text-zinc-500">{s.competition}</div>
                  <div className={`text-sm font-bold font-mono mt-1 ${styleMatchColor(s.score)}`}>
                    {s.score.toFixed(1)}% match
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Roster */}
        {roster.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">👥 Roster ({roster.length} players)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-3 py-2">Pos</th>
                    <th className="text-left px-3 py-2">Player</th>
                    <th className="text-right px-3 py-2">Age</th>
                    <th className="text-right px-3 py-2">Min</th>
                    <th className="text-right px-3 py-2">MP</th>
                    <th className="text-right px-3 py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map(p => (
                    <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                      <td className="px-3 py-2">
                        <span className="inline-block px-2 py-0.5 text-xs font-bold text-white rounded bg-zinc-700">
                          {p.pg || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/player/${p.id}`} className="text-white hover:text-blue-400 font-medium transition-colors">
                          {p.n}
                        </Link>
                        <div className="text-xs text-zinc-500">{p.pos}</div>
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-300">{p.age}</td>
                      <td className="px-3 py-2 text-right text-zinc-300 font-mono">{p.min}</td>
                      <td className="px-3 py-2 text-right text-zinc-300">{p.mp}</td>
                      <td className="px-3 py-2 text-right text-zinc-400 text-xs">{p.mv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

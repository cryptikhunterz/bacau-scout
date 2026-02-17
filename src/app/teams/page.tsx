'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { TeamListItem } from '@/lib/wyscoutTeamTypes';
import { loadTeamsList } from '@/lib/wyscoutTeamData';

const PAGE_SIZE = 50;

type SortField = 'n' | 'comp' | 'tm' | 'sm';
type SortDir = 'asc' | 'desc';

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

export default function TeamsDashboard() {
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [compFilter, setCompFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('sm');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadTeamsList().then(t => {
      setTeams(t);
      setLoading(false);
    });
  }, []);

  const competitions = useMemo(() => {
    const compMap: Record<string, { name: string; count: number }> = {};
    teams.forEach(t => {
      if (!compMap[t.comp]) compMap[t.comp] = { name: t.comp, count: 0 };
      compMap[t.comp].count++;
    });
    return Object.values(compMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [teams]);

  const filtered = useMemo(() => {
    let result = teams;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.n.toLowerCase().includes(q) ||
        t.comp.toLowerCase().includes(q) ||
        t.tm.toLowerCase().includes(q) ||
        getCountry(t.tm).toLowerCase().includes(q)
      );
    }
    if (compFilter) {
      result = result.filter(t => t.comp === compFilter);
    }
    return result;
  }, [teams, search, compFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: string | number | null = null;
      let bv: string | number | null = null;
      switch (sortField) {
        case 'n': av = a.n.toLowerCase(); bv = b.n.toLowerCase(); break;
        case 'comp': av = a.comp.toLowerCase(); bv = b.comp.toLowerCase(); break;
        case 'tm': av = getCountry(a.tm).toLowerCase(); bv = getCountry(b.tm).toLowerCase(); break;
        case 'sm': av = a.sm ?? -1; bv = b.sm ?? -1; break;
      }
      if (av === null || bv === null) return 0;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const paged = useMemo(() => sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [sorted, page]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'n' || field === 'comp' || field === 'tm' ? 'asc' : 'desc');
    }
    setPage(0);
  }, [sortField]);

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return <span className="text-zinc-600 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-zinc-400 text-lg">Loading team database...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="bg-zinc-800 border-b border-zinc-700 py-4 px-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Team Database</h1>
            <p className="text-sm text-zinc-400">{teams.length} teams across {competitions.length} competitions</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors text-sm">← Dashboard</Link>
            <Link href="/compare" className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors text-sm">⚖️ Compare</Link>
            <Link href="/compare/teams" className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors text-sm">🏟️ Team Compare</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Stats bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex-1 min-w-[140px]">
            <div className="text-zinc-400 text-xs uppercase tracking-wider">Teams</div>
            <div className="text-2xl font-bold text-white">{teams.length}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex-1 min-w-[140px]">
            <div className="text-zinc-400 text-xs uppercase tracking-wider">Competitions</div>
            <div className="text-2xl font-bold text-white">{competitions.length}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex-1 min-w-[140px]">
            <div className="text-zinc-400 text-xs uppercase tracking-wider">Showing</div>
            <div className="text-2xl font-bold text-white">{filtered.length}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex-1 min-w-[180px]">
            <div className="text-zinc-400 text-xs uppercase tracking-wider">Reference Team</div>
            <div className="text-lg font-bold text-amber-400">⭐ FC Bacău</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Search team, competition, country..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex-1 min-w-[200px]"
          />
          <select
            value={compFilter}
            onChange={e => { setCompFilter(e.target.value); setPage(0); }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 min-w-[200px]"
          >
            <option value="">All Competitions</option>
            {competitions.map(c => (
              <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort('n')}>
                    Team {sortIcon('n')}
                  </th>
                  <th className="text-left px-4 py-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort('comp')}>
                    Competition {sortIcon('comp')}
                  </th>
                  <th className="text-left px-4 py-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort('tm')}>
                    Country {sortIcon('tm')}
                  </th>
                  <th className="text-right px-4 py-3 cursor-pointer hover:text-white select-none" onClick={() => handleSort('sm')}>
                    Style Match % {sortIcon('sm')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map(t => (
                  <tr
                    key={t.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{t.n}</div>
                      <div className="text-xs text-zinc-500">{t.tm}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 text-xs">{t.comp}</td>
                    <td className="px-4 py-3 text-zinc-300 text-sm">{getCountry(t.tm)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${styleMatchColor(t.sm)}`}>
                      {t.sm !== null ? `${t.sm}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <div className="text-sm text-zinc-400">
                Page {page + 1} of {totalPages} · {sorted.length} teams
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { TeamListItem, WyscoutTeam } from '@/lib/wyscoutTeamTypes';
import { loadTeamsList, loadTeam } from '@/lib/wyscoutTeamData';
import { percentileColor, percentileTextColor } from '@/lib/wyscoutUtils';
import TeamCompareRadar from '@/components/TeamCompareRadar';

const MAX_COMPARE = 3;

const COMPARE_COLORS = [
  { label: 'blue', text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
  { label: 'red', text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' },
  { label: 'green', text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40' },
];

export default function TeamComparePage() {
  const [allTeams, setAllTeams] = useState<TeamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WyscoutTeam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [compareMode, setCompareMode] = useState<'league' | 'global'>('global');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTeamsList().then(t => {
      setAllTeams(t);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const q = searchTerm.toLowerCase();
    const selectedIds = new Set(selected.map(t => t.id));
    return allTeams
      .filter(t => !selectedIds.has(t.id) && (
        t.n.toLowerCase().includes(q) ||
        t.comp.toLowerCase().includes(q) ||
        t.tm.toLowerCase().includes(q)
      ))
      .slice(0, 15);
  }, [searchTerm, allTeams, selected]);

  const addTeam = async (teamItem: TeamListItem) => {
    if (selected.length >= MAX_COMPARE) return;
    const full = await loadTeam(teamItem.id);
    if (full) {
      setSelected(prev => [...prev, full]);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const removeTeam = (id: string) => {
    setSelected(prev => prev.filter(t => t.id !== id));
  };

  const commonMetricKeys = useMemo(() => {
    if (selected.length === 0) return [];
    const allKeys = new Set<string>();
    selected.forEach(t => {
      Object.keys(t.m || {}).forEach(k => allKeys.add(k));
    });
    return [...allKeys].sort();
  }, [selected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-zinc-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="bg-zinc-800 border-b border-zinc-700 py-4 px-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Team Comparison</h1>
            <p className="text-sm text-zinc-400 mt-1">Compare up to {MAX_COMPARE} teams side by side</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors text-sm">← Dashboard</Link>
            <Link href="/compare" className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors text-sm">⚖️ Compare</Link>
            <Link href="/teams" className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors text-sm">📊 Team DB</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Search */}
        <div ref={searchRef} className="relative mb-6">
          <input
            type="text"
            placeholder={selected.length >= MAX_COMPARE ? 'Maximum teams reached' : 'Search team to add...'}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            disabled={selected.length >= MAX_COMPARE}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-[300px] overflow-auto z-50">
              {searchResults.map(t => (
                <button
                  key={t.id}
                  onClick={() => addTeam(t)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 text-left transition-colors"
                >
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-blue-500/15 text-blue-400 border-blue-500/30">
                    {t.tm}
                  </span>
                  <span className="text-white text-sm font-medium">{t.n}</span>
                  <span className="text-zinc-500 text-xs">{t.comp}</span>
                  {t.sm !== null && (
                    <span className="text-zinc-600 text-xs ml-auto font-mono">{t.sm}%</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected teams */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {selected.map((t, idx) => {
              const color = COMPARE_COLORS[idx];
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${color.bg} ${color.border}`}
                >
                  <span className={`text-sm font-medium ${color.text}`}>{t.n}</span>
                  <span className="text-zinc-500 text-xs">{t.comp}</span>
                  <button
                    onClick={() => removeTeam(t.id)}
                    className="ml-1 text-zinc-500 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {selected.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <div className="text-zinc-500 text-lg mb-2">No teams selected</div>
            <div className="text-zinc-600 text-sm">Search and add up to 3 teams to compare</div>
          </div>
        )}

        {/* Radar charts + bar graphs */}
        {selected.length >= 2 && (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Percentile mode:</span>
                <div className="flex bg-zinc-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setCompareMode('league')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      compareMode === 'league' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    🏆 League
                  </button>
                  <button
                    onClick={() => setCompareMode('global')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      compareMode === 'global' ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    🌍 Global
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-1">📊 Percentile Radar</h2>
                <p className="text-xs text-zinc-500 mb-4">
                  {compareMode === 'global' ? 'Global percentile values' : 'League percentile values'}
                </p>
                <TeamCompareRadar teams={selected} height={450} mode={compareMode} radarMode="percentile" />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-1">📈 Raw Stats</h2>
                <p className="text-xs text-zinc-500 mb-4">
                  Actual values · Each axis scaled independently
                </p>
                <TeamCompareRadar teams={selected} height={450} mode={compareMode} radarMode="raw" />
              </div>
            </div>

            {/* Bar Graph Comparisons */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-1">📊 Stat Comparison</h2>
              <p className="text-xs text-zinc-500 mb-4">Percentile bars out of 100 · Color-coded by ranking</p>
              <div className="space-y-3">
                {commonMetricKeys.map(key => {
                  const values = selected.map(t => ({
                    val: t.m[key],
                    pct: compareMode === 'global' ? (t.gp[key] ?? null) : (t.p[key] ?? null),
                    label: t.ml[key] || key,
                  }));
                  if (values.every(v => v.val === undefined)) return null;

                  const textColors = ['text-blue-400', 'text-red-400', 'text-green-400'];

                  return (
                    <div key={key} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400 truncate max-w-[250px]">{values[0].label}</span>
                      </div>
                      <div className="space-y-1">
                        {selected.map((t, idx) => {
                          const v = values[idx];
                          const pct = v.pct;
                          const width = pct !== null ? pct : 0;
                          return (
                            <div key={t.id} className="flex items-center gap-2">
                              <span className={`text-[10px] font-medium w-20 truncate ${textColors[idx]}`}>{t.n}</span>
                              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${percentileColor(pct)} transition-all`}
                                  style={{ width: `${Math.max(width, 0.5)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-white w-14 text-right">
                                {v.val !== undefined ? v.val : '—'}
                              </span>
                              <span className={`text-[10px] font-mono font-bold w-8 text-right ${percentileTextColor(pct)}`}>
                                {pct !== null ? pct : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Metrics table */}
        {selected.length >= 2 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <h3 className="font-semibold text-white">Metrics Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-2">Metric</th>
                    {selected.map((t, idx) => (
                      <th key={t.id} className={`text-right px-4 py-2 ${COMPARE_COLORS[idx].text}`}>
                        {t.n}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-800/50 bg-zinc-800/20">
                    <td className="px-4 py-2 text-zinc-400 font-medium">Style Match to Bacău</td>
                    {selected.map(t => (
                      <td key={t.id} className="px-4 py-2 text-right text-amber-400 font-medium">
                        {t.styleMatch !== null ? `${t.styleMatch}%` : '—'}
                      </td>
                    ))}
                  </tr>
                  {commonMetricKeys.map(key => {
                    const values = selected.map(t => ({
                      val: t.m[key],
                      pct: compareMode === 'global' ? (t.gp[key] ?? null) : (t.p[key] ?? null),
                      label: t.ml[key] || key,
                    }));
                    if (values.every(v => v.val === undefined)) return null;

                    const validPcts = values.filter(v => v.pct !== null).map(v => v.pct!);
                    const maxPct = validPcts.length > 0 ? Math.max(...validPcts) : null;

                    return (
                      <tr key={key} className="border-b border-zinc-800/30 hover:bg-zinc-800/30">
                        <td className="px-4 py-2 text-zinc-400">{values[0].label}</td>
                        {values.map((v, idx) => (
                          <td key={idx} className="px-4 py-2 text-right">
                            <span className={`font-mono ${v.pct === maxPct && maxPct !== null ? 'font-bold text-white' : 'text-zinc-300'}`}>
                              {v.val !== undefined ? v.val : '—'}
                            </span>
                            {v.pct !== null && (
                              <span className={`text-xs ml-1.5 ${percentileTextColor(v.pct)}`}>
                                p{v.pct}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

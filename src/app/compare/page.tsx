'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { WyscoutPlayer, WyscoutPositionMetrics } from '@/lib/wyscoutTypes';
import { loadWyscoutPlayers, loadWyscoutPlayer, loadWyscoutPositionMetrics } from '@/lib/wyscoutData';
import { percentileColor, percentileTextColor, positionBadge, formatMarketValue } from '@/lib/wyscoutUtils';
import CompareRadar from '@/components/CompareRadar';

const MAX_COMPARE = 3;
const POSITION_GROUPS = ['GK', 'CB', 'WB', 'DM', 'CM', 'AM', 'FW'];

const COMPARE_COLORS = [
  { label: 'blue', text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
  { label: 'red', text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' },
  { label: 'green', text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40' },
];

export default function ComparePage() {
  const [allPlayers, setAllPlayers] = useState<WyscoutPlayer[]>([]);
  const [posMetrics, setPosMetrics] = useState<WyscoutPositionMetrics>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WyscoutPlayer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [radarTemplate, setRadarTemplate] = useState<string>('');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([loadWyscoutPlayers(), loadWyscoutPositionMetrics()]).then(([p, pm]) => {
      setAllPlayers(p);
      setPosMetrics(pm);
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
    const selectedIds = new Set(selected.map(p => p.id));
    return allPlayers
      .filter(p => !selectedIds.has(p.id) && (
        p.n.toLowerCase().includes(q) ||
        p.sn.toLowerCase().includes(q) ||
        p.cl.toLowerCase().includes(q)
      ))
      .slice(0, 15);
  }, [searchTerm, allPlayers, selected]);

  const addPlayer = async (player: WyscoutPlayer) => {
    if (selected.length >= MAX_COMPARE) return;
    const full = await loadWyscoutPlayer(player.id);
    if (full) {
      setSelected(prev => [...prev, full]);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const removePlayer = (id: number) => {
    setSelected(prev => prev.filter(p => p.id !== id));
  };

  const commonMetricKeys = useMemo(() => {
    if (selected.length === 0) return [];
    const pg = selected[0].pg;
    const posDef = posMetrics[pg] || [];
    const posKeys = posDef.map(m => m.key);
    
    const allKeys = new Set<string>();
    selected.forEach(p => {
      Object.keys(p.m || {}).forEach(k => allKeys.add(k));
    });
    
    const restKeys = [...allKeys].filter(k => !posKeys.includes(k)).sort();
    return [...posKeys, ...restKeys];
  }, [selected, posMetrics]);

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
            <h1 className="text-2xl font-bold text-white">Player Comparison</h1>
            <p className="text-sm text-zinc-400 mt-1">Compare up to {MAX_COMPARE} players side by side</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors text-sm">← Dashboard</Link>
            <Link href="/compare/teams" className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors text-sm">🏟️ Teams</Link>
            <Link href="/teams" className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors text-sm">📊 Team DB</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Search */}
        <div ref={searchRef} className="relative mb-6">
          <input
            type="text"
            placeholder={selected.length >= MAX_COMPARE ? 'Maximum players reached' : 'Search player to add...'}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            disabled={selected.length >= MAX_COMPARE}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-[300px] overflow-auto z-50">
              {searchResults.map(p => {
                const b = positionBadge(p.pg);
                return (
                  <button
                    key={p.id}
                    onClick={() => addPlayer(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 text-left transition-colors"
                  >
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${b.bg} ${b.text} ${b.border}`}>
                      {p.pg}
                    </span>
                    <span className="text-white text-sm font-medium">{p.n}</span>
                    <span className="text-zinc-500 text-xs">{p.cl}</span>
                    <span className="text-zinc-600 text-xs ml-auto">{p.lg}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected players */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {selected.map((p, idx) => {
              const color = COMPARE_COLORS[idx];
              const b = positionBadge(p.pg);
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${color.bg} ${color.border}`}
                >
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${b.bg} ${b.text} ${b.border}`}>
                    {p.pg}
                  </span>
                  <span className={`text-sm font-medium ${color.text}`}>{p.n}</span>
                  <span className="text-zinc-500 text-xs">{p.cl}</span>
                  <button
                    onClick={() => removePlayer(p.id)}
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
            <div className="text-zinc-500 text-lg mb-2">No players selected</div>
            <div className="text-zinc-600 text-sm">Search and add up to 3 players to compare</div>
          </div>
        )}

        {/* Radar Template Selector + Radar Charts */}
        {selected.length >= 2 && (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-4">
                <label className="text-sm text-zinc-400 whitespace-nowrap">Radar Template</label>
                <select
                  value={radarTemplate || selected[0].pg}
                  onChange={e => setRadarTemplate(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {POSITION_GROUPS.map(pg => (
                    <option key={pg} value={pg}>
                      {pg} — {pg === 'GK' ? 'Goalkeeper' : pg === 'CB' ? 'Centre-Back' : pg === 'WB' ? 'Wing-Back' : pg === 'DM' ? 'Defensive Mid' : pg === 'CM' ? 'Central Mid' : pg === 'AM' ? 'Attacking Mid' : 'Forward'}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-zinc-600">Choose which position metrics to display on radars</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-1">📊 Percentile Radar</h2>
                <p className="text-xs text-zinc-500 mb-4">
                  Using {radarTemplate || selected[0].pg} position metrics · Percentile values
                </p>
                <CompareRadar players={selected} positionMetrics={posMetrics} height={450} positionGroup={radarTemplate || undefined} />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-1">📈 Raw Stats /90</h2>
                <p className="text-xs text-zinc-500 mb-4">
                  Actual per-90 values · Each axis scaled independently
                </p>
                <CompareRadar players={selected} positionMetrics={posMetrics} height={450} mode="raw" positionGroup={radarTemplate || undefined} />
              </div>
            </div>
          </>
        )}

        {/* Bar Graph Comparisons */}
        {selected.length >= 2 && (() => {
          const pg = selected[0].pg;
          const posDef = posMetrics[pg] || [];
          const posKeys = posDef.map(m => m.key);
          const allKeys = new Set<string>();
          selected.forEach(p => {
            Object.keys(p.m || {}).forEach(k => allKeys.add(k));
          });
          const restKeys = [...allKeys].filter(k => !posKeys.includes(k)).sort();
          const barMetricKeys = [...posKeys, ...restKeys];

          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-1">📊 Stat Comparison</h2>
              <p className="text-xs text-zinc-500 mb-4">Percentile bars out of 100 · Color-coded by ranking</p>
              <div className="space-y-3">
                {barMetricKeys.map(key => {
                  const values = selected.map(p => ({
                    val: p.m?.[key],
                    pct: p.p?.[key] ?? null,
                  }));
                  if (values.every(v => v.val === undefined)) return null;

                  const textColors = ['text-blue-400', 'text-red-400', 'text-green-400'];

                  return (
                    <div key={key} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400 truncate max-w-[200px]">{key}</span>
                      </div>
                      <div className="space-y-1">
                        {selected.map((p, idx) => {
                          const val = values[idx].val;
                          const pct = values[idx].pct;
                          const width = pct !== null ? pct : 0;
                          return (
                            <div key={p.id} className="flex items-center gap-2">
                              <span className={`text-[10px] font-medium w-16 truncate ${textColors[idx]}`}>{p.sn}</span>
                              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${percentileColor(pct)} transition-all`}
                                  style={{ width: `${Math.max(width, 0.5)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-white w-12 text-right">
                                {val !== undefined ? val : '—'}
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
          );
        })()}

        {/* Side-by-side metrics table */}
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
                    {selected.map((p, idx) => (
                      <th key={p.id} className={`text-right px-4 py-2 ${COMPARE_COLORS[idx].text}`}>
                        {p.sn}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-800/50 bg-zinc-800/20">
                    <td className="px-4 py-2 text-zinc-400 font-medium">Market Value</td>
                    {selected.map(p => (
                      <td key={p.id} className="px-4 py-2 text-right text-green-400 font-medium">
                        {formatMarketValue(p.mv)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-zinc-800/50 bg-zinc-800/20">
                    <td className="px-4 py-2 text-zinc-400 font-medium">Minutes / Matches</td>
                    {selected.map(p => (
                      <td key={p.id} className="px-4 py-2 text-right text-zinc-300">
                        {p.min.toLocaleString()} / {p.mp}
                      </td>
                    ))}
                  </tr>
                  {commonMetricKeys.map(key => {
                    const values = selected.map(p => ({
                      val: p.m?.[key],
                      pct: p.p?.[key] ?? null,
                    }));
                    if (values.every(v => v.val === undefined)) return null;
                    
                    const validPcts = values.filter(v => v.pct !== null).map(v => v.pct!);
                    const maxPct = validPcts.length > 0 ? Math.max(...validPcts) : null;

                    return (
                      <tr key={key} className="border-b border-zinc-800/30 hover:bg-zinc-800/30">
                        <td className="px-4 py-2 text-zinc-400">{key}</td>
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

export function formatMarketValue(val: string | null): string {
  if (!val) return '—';
  return val;
}

export function percentileColor(pct: number | null): string {
  if (pct === null) return 'bg-zinc-700';
  if (pct >= 81) return 'bg-emerald-500';
  if (pct >= 61) return 'bg-green-400';
  if (pct >= 41) return 'bg-yellow-500';
  if (pct >= 21) return 'bg-amber-500';
  return 'bg-red-600';
}

export function percentileTextColor(pct: number | null): string {
  if (pct === null) return 'text-zinc-500';
  if (pct >= 81) return 'text-emerald-400';
  if (pct >= 61) return 'text-green-400';
  if (pct >= 41) return 'text-yellow-400';
  if (pct >= 21) return 'text-amber-400';
  return 'text-red-400';
}

export function percentileBgClass(pct: number | null): string {
  if (pct === null) return 'bg-zinc-800';
  if (pct >= 90) return 'bg-green-500/20';
  if (pct >= 75) return 'bg-green-400/10';
  if (pct >= 50) return 'bg-zinc-800/50';
  if (pct >= 25) return 'bg-yellow-500/10';
  return 'bg-red-500/10';
}

export const POSITION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GK: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  CB: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  WB: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  DM: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  CM: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
  AM: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  FW: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
};

export function positionBadge(pg: string): { bg: string; text: string; border: string } {
  return POSITION_COLORS[pg] || { bg: 'bg-zinc-700/15', text: 'text-zinc-400', border: 'border-zinc-500/30' };
}

'use client';

interface GradesFiltersProps {
  filters: {
    verdict: string;
    minAbility: number;
    position: string;
  };
  onChange: (filters: GradesFiltersProps['filters']) => void;
}

export function GradesFilters({ filters, onChange }: GradesFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Verdict toggle buttons */}
      <div className="flex gap-1">
        {['All', 'Sign', 'Observe', 'Monitor', 'Not a priority', 'Out of reach', 'Discard'].map((v) => (
          <button
            key={v}
            onClick={() => onChange({ ...filters, verdict: v === 'All' ? '' : v })}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              (v === 'All' && !filters.verdict) || filters.verdict === v
                ? 'bg-zinc-800 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Min Ability dropdown */}
      <select
        value={filters.minAbility}
        onChange={(e) => onChange({ ...filters, minAbility: Number(e.target.value) })}
        className="px-3 py-1.5 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
      >
        <option value={0}>Min Ability: All</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            Min Ability: {n}+
          </option>
        ))}
      </select>

      {/* Position dropdown */}
      <select
        value={filters.position}
        onChange={(e) => onChange({ ...filters, position: e.target.value })}
        className="px-3 py-1.5 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
      >
        <option value="">Position: All</option>
        <option value="Goalkeeper">GK</option>
        <option value="Defender">DEF</option>
        <option value="Midfielder">MID</option>
        <option value="Forward">FWD</option>
      </select>
    </div>
  );
}

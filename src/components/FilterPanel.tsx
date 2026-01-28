'use client';

import { useState } from 'react';
import { FilterState } from '@/types/player';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  positions: string[];
}

const emptyFilters: FilterState = {
  position: '',
  club: '',
  minAge: '',
  maxAge: '',
  minValue: '',
  maxValue: '',
};

export default function FilterPanel({ filters, onChange, positions }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field: keyof FilterState, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  const handleClear = () => {
    onChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] text-sm font-medium
                   text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800
                   rounded-lg transition-colors"
      >
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            &#9658;
          </span>
          Filters
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
              Active
            </span>
          )}
        </span>
        {hasActiveFilters && !isExpanded && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Click to expand
          </span>
        )}
      </button>

      {/* Filter Controls with smooth height transition */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out
                    ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            {/* Mobile: single column, SM+: 2 columns, LG+: 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4">
              {/* Position Dropdown */}
              <div className="space-y-1">
                <label
                  htmlFor="filter-position"
                  className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Position
                </label>
                <select
                  id="filter-position"
                  value={filters.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] text-sm bg-white dark:bg-zinc-800
                             border border-zinc-300 dark:border-zinc-600 rounded-md
                             text-zinc-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All positions</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Club Input */}
              <div className="space-y-1">
                <label
                  htmlFor="filter-club"
                  className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Club
                </label>
                <input
                  id="filter-club"
                  type="text"
                  value={filters.club}
                  onChange={(e) => handleChange('club', e.target.value)}
                  placeholder="e.g. Barcelona"
                  className="w-full px-3 py-2 min-h-[44px] text-sm bg-white dark:bg-zinc-800
                             border border-zinc-300 dark:border-zinc-600 rounded-md
                             text-zinc-900 dark:text-white placeholder-zinc-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Age Range */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Age Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={filters.minAge}
                    onChange={(e) => handleChange('minAge', e.target.value)}
                    placeholder="Min"
                    min="15"
                    max="50"
                    className="w-full px-3 py-2 min-h-[44px] text-sm bg-white dark:bg-zinc-800
                               border border-zinc-300 dark:border-zinc-600 rounded-md
                               text-zinc-900 dark:text-white placeholder-zinc-400
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-zinc-400 dark:text-zinc-500 shrink-0">-</span>
                  <input
                    type="number"
                    value={filters.maxAge}
                    onChange={(e) => handleChange('maxAge', e.target.value)}
                    placeholder="Max"
                    min="15"
                    max="50"
                    className="w-full px-3 py-2 min-h-[44px] text-sm bg-white dark:bg-zinc-800
                               border border-zinc-300 dark:border-zinc-600 rounded-md
                               text-zinc-900 dark:text-white placeholder-zinc-400
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Market Value Range */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Market Value (EUR)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-sm">
                      &euro;
                    </span>
                    <input
                      type="text"
                      value={filters.minValue}
                      onChange={(e) => handleChange('minValue', e.target.value)}
                      placeholder="Min"
                      className="w-full pl-7 pr-3 py-2 min-h-[44px] text-sm bg-white dark:bg-zinc-800
                                 border border-zinc-300 dark:border-zinc-600 rounded-md
                                 text-zinc-900 dark:text-white placeholder-zinc-400
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <span className="text-zinc-400 dark:text-zinc-500 shrink-0">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-sm">
                      &euro;
                    </span>
                    <input
                      type="text"
                      value={filters.maxValue}
                      onChange={(e) => handleChange('maxValue', e.target.value)}
                      placeholder="Max"
                      className="w-full pl-7 pr-3 py-2 min-h-[44px] text-sm bg-white dark:bg-zinc-800
                                 border border-zinc-300 dark:border-zinc-600 rounded-md
                                 text-zinc-900 dark:text-white placeholder-zinc-400
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 min-h-[44px] text-sm font-medium text-zinc-600 dark:text-zinc-400
                             hover:text-zinc-900 dark:hover:text-white
                             bg-zinc-200 dark:bg-zinc-700 rounded-md
                             hover:bg-zinc-300 dark:hover:bg-zinc-600
                             transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

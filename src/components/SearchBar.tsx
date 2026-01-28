'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchPlayer, FilterState } from '@/types/player';
import PlayerList, { ViewMode } from './PlayerList';
import FilterPanel from './FilterPanel';

const emptyFilters: FilterState = {
  position: '',
  club: '',
  minAge: '',
  maxAge: '',
  minValue: '',
  maxValue: '',
};

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// View toggle button component
function ViewToggle({
  viewMode,
  onToggle,
}: {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-700 rounded-md p-1">
      <button
        onClick={() => onToggle('grid')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors
                    ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
        title="Grid view"
      >
        <span aria-hidden="true">&#9638;</span>
        <span className="sr-only">Grid view</span>
      </button>
      <button
        onClick={() => onToggle('list')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors
                    ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
        title="List view"
      >
        <span aria-hidden="true">&#9776;</span>
        <span className="sr-only">List view</span>
      </button>
    </div>
  );
}

// Build filter query string from FilterState (only non-empty values)
function buildFilterParams(filters: FilterState): string {
  const params = new URLSearchParams();

  if (filters.position) params.set('position', filters.position);
  if (filters.club) params.set('club', filters.club);
  if (filters.minAge) params.set('minAge', filters.minAge);
  if (filters.maxAge) params.set('maxAge', filters.maxAge);
  if (filters.minValue) params.set('minValue', filters.minValue);
  if (filters.maxValue) params.set('maxValue', filters.maxValue);

  const queryString = params.toString();
  return queryString ? `&${queryString}` : '';
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  const debouncedQuery = useDebounce(query, 300);
  const debouncedFilters = useDebounce(filters, 300);

  // Fetch search results
  const searchPlayers = useCallback(async (searchTerm: string, filterState: FilterState) => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const filterParams = buildFilterParams(filterState);
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}${filterParams}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger search on debounced query or filter change
  useEffect(() => {
    searchPlayers(debouncedQuery, debouncedFilters);
  }, [debouncedQuery, debouncedFilters, searchPlayers]);

  // Extract unique positions from results (sorted alphabetically)
  const uniquePositions = useMemo(() => {
    const positions = new Set<string>();
    results.forEach(player => {
      if (player.position) {
        positions.add(player.position);
      }
    });
    return Array.from(positions).sort();
  }, [results]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Input */}
      <div className="relative max-w-2xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players..."
          className="w-full px-4 py-3 text-lg border border-zinc-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:bg-zinc-800 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Filter Panel - show after user has searched */}
      {hasSearched && (
        <div className="mt-4 max-w-2xl mx-auto">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            positions={uniquePositions}
          />
        </div>
      )}

      {/* Results */}
      <div className="mt-4">
        {isLoading ? (
          <p className="text-center text-zinc-500 dark:text-zinc-400">Searching...</p>
        ) : hasSearched && results.length === 0 ? (
          <p className="text-center text-zinc-500 dark:text-zinc-400">No players found</p>
        ) : results.length > 0 ? (
          <div>
            {/* Results header with count and view toggle */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {results.length} player{results.length !== 1 ? 's' : ''} found
              </p>
              <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
            </div>
            <PlayerList players={results} viewMode={viewMode} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

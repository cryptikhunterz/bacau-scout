'use client';

import { useState, useEffect, useCallback } from 'react';

// Player type for search results
interface Player {
  name: string;
  position: string | null;
  age: string | null;
  club: string | null;
  marketValue: string | null;
  nationality: string[];
  url: string | null;
  playerId: string | null;
}

// Format market value for display
function formatMarketValue(value: string | null): string {
  if (!value) return '-';
  // If already formatted (from JSON), return as-is
  if (value.startsWith('€')) return value;

  const num = parseInt(value, 10);
  if (isNaN(num) || num === 0) return '-';
  if (num < 1000) return `€${num}`;
  if (num < 1000000) return `€${Math.round(num / 1000)}K`;
  return `€${(num / 1000000).toFixed(1)}M`;
}

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

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch search results
  const searchPlayers = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
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

  // Trigger search on debounced query change
  useEffect(() => {
    searchPlayers(debouncedQuery);
  }, [debouncedQuery, searchPlayers]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
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

      {/* Results */}
      <div className="mt-4">
        {isLoading ? (
          <p className="text-center text-zinc-500 dark:text-zinc-400">Searching...</p>
        ) : hasSearched && results.length === 0 ? (
          <p className="text-center text-zinc-500 dark:text-zinc-400">No players found</p>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
              {results.length} player{results.length !== 1 ? 's' : ''} found
            </p>
            {results.map((player, index) => (
              <div
                key={`${player.name}-${index}`}
                className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700
                           rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                      {player.name}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {player.position || 'Position unknown'}
                      {player.age && ` • Age ${player.age}`}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-500">
                      {player.club || 'Club unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatMarketValue(player.marketValue)}
                    </p>
                    {player.nationality && player.nationality.length > 0 && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        {player.nationality.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
